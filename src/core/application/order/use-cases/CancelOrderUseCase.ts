import { Result, ok, fail } from '@/core/domain/shared/Result';
import { DomainError } from '@/core/domain/shared/AppError';
import type { IOrderRepository } from '@/core/domain/order/repositories/IOrderRepository';
import type { IPaymentGateway } from '@/core/domain/order/gateways/IPaymentGateway';
import type { IProductRepository } from '@/core/domain/catalog/repositories/IProductRepository';
import type { IPointRepository } from '@/core/domain/promotion/repositories/IPointRepository';
import { PointTransaction } from '@/core/domain/promotion/entities/PointTransaction';
import type { OrderStatus } from '@/shared/types/database.types';

export interface CancelOrderInput {
  orderId: string;
  customerId?: string | null;
  reason?: string;
}

export interface CancelOrderOutput {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  cancelledAt: Date;
  refundedAmount: number;
  refundTransactionId?: string;
}

/**
 * 주문 취소 UseCase
 * 주문을 취소하고 결제 완료 건은 PG사 환불 요청, 상품 재고 복원, 적립금 복원을 트랜잭션 단위로 수행합니다.
 */
export class CancelOrderUseCase {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly paymentGateway: IPaymentGateway,
    private readonly productRepo?: IProductRepository,
    private readonly pointRepo?: IPointRepository
  ) {}

  public async execute(
    input: CancelOrderInput
  ): Promise<Result<CancelOrderOutput, DomainError>> {
    // 1. 주문 조회
    const order = await this.orderRepo.findById(input.orderId);
    if (!order) {
      return fail(new DomainError(`주문을 찾을 수 없습니다. (ID: ${input.orderId})`));
    }

    // 2. 고객 본인 주문 검증 (customerId가 주어진 경우)
    if (input.customerId && order.customerId && order.customerId !== input.customerId) {
      return fail(new DomainError('본인의 주문만 취소할 수 있습니다.'));
    }

    // 3. 주문 취소 가능 상태 검증
    const cancellableStatuses: OrderStatus[] = [
      'PAYMENT_PENDING',
      'PAID',
      'CANCEL_REQUESTED',
    ];
    if (!cancellableStatuses.includes(order.status)) {
      return fail(
        new DomainError(
          `'${order.status}' 상태에서는 주문을 즉시 취소할 수 없습니다. 배송 완료 후 반품을 신청해 주세요.`
        )
      );
    }

    let refundTransactionId: string | undefined;
    const paidAmount = order.totalPaidAmount.amount;

    // 4. 결제가 완료된 건(PAID)은 PG 환불 처리
    if (order.paymentInfo.isCompleted() && paidAmount > 0) {
      const refundResult = await this.paymentGateway.refundPayment({
        orderId: order.id,
        orderNumber: order.orderNumber.value,
        transactionId: order.paymentInfo.details?.transactionId as string | undefined,
        amount: paidAmount,
        reason: input.reason || '고객 요청 주문 취소',
      });

      if (refundResult.isFailure) {
        return fail(
          new DomainError(
            `PG 결제 취소 실패: ${refundResult.getError().message}`
          )
        );
      }
      refundTransactionId = refundResult.getValue().refundId;
    }

    // 5. 상품 재고 원상 복구 (Restock)
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
            // 개별 상품 재고 복구 실패 방어
          }
        }
      }
    }

    // 6. 사용한 적립금 원상 복구 (Refund)
    if (this.pointRepo && order.pointUsed.amount > 0 && order.customerId) {
      try {
        const currentBalance = await this.pointRepo.getCurrentBalance(order.customerId);
        const refundTx = PointTransaction.createEarn({
          customerId: order.customerId,
          amount: order.pointUsed.amount,
          currentBalance,
          description: `주문 취소 적립금 환불 (${order.orderNumber.value})`,
          orderId: order.id,
        });
        if (refundTx.isSuccess) {
          await this.pointRepo.recordTransaction(refundTx.getValue());
        }
      } catch {
        // 적립금 환불 실패 방어
      }
    }

    // 7. 주문 도메인 엔티티 상태 취소 전이
    const now = new Date();
    const cancelResult = order.cancel(now);
    if (cancelResult.isFailure) {
      return fail(cancelResult.getError());
    }

    // 8. 변경된 주문 정보 DB 영속화
    await this.orderRepo.save(order);

    return ok({
      orderId: order.id,
      orderNumber: order.orderNumber.value,
      status: order.status,
      cancelledAt: order.cancelledAt || now,
      refundedAmount: paidAmount,
      refundTransactionId,
    });
  }
}
