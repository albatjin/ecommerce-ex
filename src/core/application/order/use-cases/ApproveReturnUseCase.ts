import { Result, ok, fail } from '@/core/domain/shared/Result';
import { DomainError } from '@/core/domain/shared/AppError';
import type { IOrderRepository } from '@/core/domain/order/repositories/IOrderRepository';
import type { IPaymentGateway } from '@/core/domain/order/gateways/IPaymentGateway';
import type { IProductRepository } from '@/core/domain/catalog/repositories/IProductRepository';
import type { IPointRepository } from '@/core/domain/promotion/repositories/IPointRepository';
import { PointTransaction } from '@/core/domain/promotion/entities/PointTransaction';
import type { OrderStatus } from '@/shared/types/database.types';

export interface ApproveReturnInput {
  orderId: string;
  adminNote?: string;
}

export interface ApproveReturnOutput {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  returnedAt: Date;
  refundedAmount: number;
  refundedPoints?: number;
  refundTransactionId?: string;
}

/**
 * 반품 승인 UseCase (관리자용)
 * 고객의 반품 요청(RETURN_REQUESTED)을 검수 후 최종 승인합니다.
 * PG사 결제 환불 요청, 상품 재고 복원, 고객 사용 적립금 환불을 일괄 처리합니다.
 */
export class ApproveReturnUseCase {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly paymentGateway: IPaymentGateway,
    private readonly productRepo?: IProductRepository,
    private readonly pointRepo?: IPointRepository
  ) {}

  public async execute(
    input: ApproveReturnInput
  ): Promise<Result<ApproveReturnOutput, DomainError>> {
    // 1. 주문 조회
    const order = await this.orderRepo.findById(input.orderId);
    if (!order) {
      return fail(new DomainError(`주문을 찾을 수 없습니다. (ID: ${input.orderId})`));
    }

    // 2. 반품 승인 가능 상태 검증 (RETURN_REQUESTED 상태여야 함)
    if (order.status !== 'RETURN_REQUESTED') {
      return fail(
        new DomainError(
          `반품 요청('RETURN_REQUESTED') 상태의 주문만 반품을 승인할 수 있습니다. (현재 상태: ${order.status})`
        )
      );
    }

    // 3. PG 결제 환불 처리 (결제 금액이 있는 경우)
    const paidAmount = order.totalPaidAmount.amount;
    let refundTransactionId: string | undefined;

    if (order.paymentInfo.isCompleted() && paidAmount > 0) {
      const refundResult = await this.paymentGateway.refundPayment({
        orderId: order.id,
        orderNumber: order.orderNumber.value,
        transactionId: order.paymentInfo.details?.transactionId as string | undefined,
        amount: paidAmount,
        reason: input.adminNote || '반품 승인에 따른 자동 환불',
      });

      if (refundResult.isFailure) {
        return fail(
          new DomainError(`PG사 결제 환불 실패: ${refundResult.getError().message}`)
        );
      }

      refundTransactionId = refundResult.getValue().refundId;
    }

    // 4. 상품 재고 복원 (Restock)
    if (this.productRepo) {
      for (const item of order.items) {
        if (item.productId) {
          try {
            const product = await this.productRepo.findById(item.productId);
            if (product) {
              product.restock(item.quantity);
              await this.productRepo.update(product);
            }
          } catch {
            // 재고 복원 실패 시 로깅 후 지속 진행
          }
        }
      }
    }

    // 5. 사용 적립금 환불 (Point Refund)
    const customerId = order.customerId;
    if (this.pointRepo && customerId && order.pointUsed.amount > 0) {
      try {
        const currentBalance = await this.pointRepo.getCurrentBalance(customerId);
        const refundTx = PointTransaction.createEarn({
          customerId,
          amount: order.pointUsed.amount,
          currentBalance,
          description: `반품 승인 적립금 환불 (${order.orderNumber.value})`,
          orderId: order.id,
        });
        if (refundTx.isSuccess) {
          await this.pointRepo.recordTransaction(refundTx.getValue());
        }
      } catch {
        // 적립금 환불 실패 방어
      }
    }

    // 6. 도메인 엔티티 반품 완료 전이: RETURN_REQUESTED -> RETURNED
    const now = new Date();
    const returnResult = order.completeReturn();
    if (returnResult.isFailure) {
      return fail(returnResult.getError());
    }

    // 7. 영속화
    await this.orderRepo.save(order);

    return ok({
      orderId: order.id,
      orderNumber: order.orderNumber.value,
      status: order.status,
      returnedAt: now,
      refundedAmount: paidAmount,
      refundedPoints: order.pointUsed.amount,
      refundTransactionId,
    });
  }
}
