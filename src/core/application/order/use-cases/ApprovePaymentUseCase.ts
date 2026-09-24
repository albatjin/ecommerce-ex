import { Result, ok, fail } from '@/core/domain/shared/Result';
import { DomainError } from '@/core/domain/shared/AppError';
import type { IOrderRepository } from '@/core/domain/order/repositories/IOrderRepository';
import type { IPaymentGateway } from '@/core/domain/order/gateways/IPaymentGateway';
import type { IProductRepository } from '@/core/domain/catalog/repositories/IProductRepository';
import type { IPointRepository } from '@/core/domain/promotion/repositories/IPointRepository';
import { PointTransaction } from '@/core/domain/promotion/entities/PointTransaction';
import type { OrderStatus } from '@/shared/types/database.types';

export interface ApprovePaymentInput {
  orderId: string;
  paymentDetails?: Record<string, unknown>;
}

export interface ApprovePaymentOutput {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  paidAt: Date;
  transactionId: string;
  totalPaidAmount: number;
}

/**
 * 결제 승인 UseCase
 * PG사 결제 승인을 요청하고, 승인 성공 시 주문 상태를 'PAID'로 전이합니다.
 * 결제 승인 실패 시에는 재고 및 적립금 보상 트랜잭션(Rollback)을 수행하고 주문을 'CANCELLED'로 처리합니다.
 */
export class ApprovePaymentUseCase {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly paymentGateway: IPaymentGateway,
    private readonly productRepo?: IProductRepository,
    private readonly pointRepo?: IPointRepository
  ) {}

  public async execute(
    input: ApprovePaymentInput
  ): Promise<Result<ApprovePaymentOutput, DomainError>> {
    // 1. 주문 조회
    const order = await this.orderRepo.findById(input.orderId);
    if (!order) {
      return fail(new DomainError(`주문을 찾을 수 없습니다. (ID: ${input.orderId})`));
    }

    // 2. 상태 검증: PAYMENT_PENDING 상태의 주문만 결제 진행 가능
    if (order.status !== 'PAYMENT_PENDING') {
      return fail(
        new DomainError(
          `결제 대기('PAYMENT_PENDING') 상태의 주문만 결제를 진행할 수 있습니다. (현재 상태: ${order.status})`
        )
      );
    }

    // 3. PG사에 결제 승인 요청
    const pgResult = await this.paymentGateway.requestPayment({
      orderId: order.id,
      orderNumber: order.orderNumber.value,
      amount: order.totalPaidAmount.amount,
      paymentMethod: order.paymentInfo.method,
      customerName: order.shippingAddress.recipientName,
      paymentDetails: input.paymentDetails,
    });

    // 4. 결제 실패 시 보상 트랜잭션 (재고/적립금 롤백 및 주문 취소)
    if (pgResult.isFailure) {
      const errorMessage = pgResult.getError().message;

      // 4-1. 상품 재고 원상 복구 (Restock)
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
              // 재고 복구 실패 방어
            }
          }
        }
      }

      // 4-2. 적립금 사용분 환불 원장 기록
      if (this.pointRepo && order.pointUsed.amount > 0 && order.customerId) {
        try {
          const currentBalance = await this.pointRepo.getCurrentBalance(order.customerId);
          const refundTx = PointTransaction.createEarn({
            customerId: order.customerId,
            amount: order.pointUsed.amount,
            currentBalance,
            description: `결제 승인 실패 적립금 환불 (${order.orderNumber.value})`,
            orderId: order.id,
          });
          if (refundTx.isSuccess) {
            await this.pointRepo.recordTransaction(refundTx.getValue());
          }
        } catch {
          // 적립금 환불 기록 실패 방어
        }
      }

      // 4-3. 주문 취소 상태로 변경 및 결제 실패 상태 마킹
      const cancelResult = order.cancel();
      if (cancelResult.isSuccess) {
        await this.orderRepo.save(order);
      }

      return fail(new DomainError(`결제 승인 실패: ${errorMessage}`));
    }

    // 5. 결제 성공 처리: PAYMENT_PENDING -> PAID 전이
    const approval = pgResult.getValue();
    const paidResult = order.markAsPaid(approval.approvedAt, {
      transactionId: approval.transactionId,
      ...approval.rawDetails,
    });

    if (paidResult.isFailure) {
      return fail(paidResult.getError());
    }

    // 6. 변경된 주문 정보 영속화
    await this.orderRepo.save(order);

    return ok({
      orderId: order.id,
      orderNumber: order.orderNumber.value,
      status: order.status,
      paidAt: order.paidAt || approval.approvedAt,
      transactionId: approval.transactionId,
      totalPaidAmount: order.totalPaidAmount.amount,
    });
  }
}

