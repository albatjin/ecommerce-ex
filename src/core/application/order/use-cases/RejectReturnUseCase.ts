import { Result, ok, fail } from '@/core/domain/shared/Result';
import { DomainError } from '@/core/domain/shared/AppError';
import type { IOrderRepository } from '@/core/domain/order/repositories/IOrderRepository';
import type { OrderStatus } from '@/shared/types/database.types';

export interface RejectReturnInput {
  orderId: string;
  reason: string;
}

export interface RejectReturnOutput {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  rejectionReason: string;
  rejectedAt: Date;
}

/**
 * 반품 반려(거절) UseCase (관리자용)
 * 반품 요청(RETURN_REQUESTED) 건에 대해 검수 결과 부적합 판정 시 반려하고 배송 완료(DELIVERED) 상태로 복구합니다.
 */
export class RejectReturnUseCase {
  constructor(private readonly orderRepo: IOrderRepository) {}

  public async execute(
    input: RejectReturnInput
  ): Promise<Result<RejectReturnOutput, DomainError>> {
    if (!input.reason || !input.reason.trim()) {
      return fail(new DomainError('반품 반려 사유는 필수 입력 사항입니다.'));
    }

    // 1. 주문 조회
    const order = await this.orderRepo.findById(input.orderId);
    if (!order) {
      return fail(new DomainError(`주문을 찾을 수 없습니다. (ID: ${input.orderId})`));
    }

    // 2. 반품 거절 가능 상태 검증 (RETURN_REQUESTED 상태여야 함)
    if (order.status !== 'RETURN_REQUESTED') {
      return fail(
        new DomainError(
          `반품 요청('RETURN_REQUESTED') 상태의 주문만 거절할 수 있습니다. (현재 상태: ${order.status})`
        )
      );
    }

    // 3. 도메인 엔티티 반품 거절 전이: RETURN_REQUESTED -> DELIVERED
    const rejectResult = order.rejectReturn();
    if (rejectResult.isFailure) {
      return fail(rejectResult.getError());
    }

    // 4. 영속화
    await this.orderRepo.save(order);

    return ok({
      orderId: order.id,
      orderNumber: order.orderNumber.value,
      status: order.status,
      rejectionReason: input.reason.trim(),
      rejectedAt: new Date(),
    });
  }
}

