import { Result, ok, fail } from '@/core/domain/shared/Result';
import { DomainError } from '@/core/domain/shared/AppError';
import type { IOrderRepository } from '@/core/domain/order/repositories/IOrderRepository';
import type { OrderStatus } from '@/shared/types/database.types';

export interface RequestReturnInput {
  orderId: string;
  customerId?: string | null;
  reason: string;
  detailedReason?: string;
}

export interface RequestReturnOutput {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  requestedAt: Date;
  reason: string;
}

/**
 * 반품 신청 UseCase
 * 배송 완료(DELIVERED) 상태의 주문에 대해 고객의 반품 요청을 접수하고 RETURN_REQUESTED 상태로 전이합니다.
 */
export class RequestReturnUseCase {
  constructor(private readonly orderRepo: IOrderRepository) {}

  public async execute(
    input: RequestReturnInput
  ): Promise<Result<RequestReturnOutput, DomainError>> {
    // 1. 주문 조회
    const order = await this.orderRepo.findById(input.orderId);
    if (!order) {
      return fail(new DomainError(`주문을 찾을 수 없습니다. (ID: ${input.orderId})`));
    }

    // 2. 고객 본인 주문 검증
    if (input.customerId && order.customerId && order.customerId !== input.customerId) {
      return fail(new DomainError('본인의 주문만 반품을 신청할 수 있습니다.'));
    }

    // 3. 반품 사유 입력 검증
    if (!input.reason || !input.reason.trim()) {
      return fail(new DomainError('반품 사유를 입력해 주세요.'));
    }

    // 4. 상태 검증: 배송 완료('DELIVERED') 상태만 반품 신청 가능
    if (order.status !== 'DELIVERED') {
      return fail(
        new DomainError(
          `배송 완료('DELIVERED') 상태의 주문만 반품을 신청할 수 있습니다. (현재 상태: ${order.status})`
        )
      );
    }

    // 5. 도메인 상태 전이
    const returnResult = order.requestReturn();
    if (returnResult.isFailure) {
      return fail(returnResult.getError());
    }

    // 6. DB 영속화
    await this.orderRepo.save(order);

    return ok({
      orderId: order.id,
      orderNumber: order.orderNumber.value,
      status: order.status,
      requestedAt: order.updatedAt,
      reason: input.reason.trim(),
    });
  }
}
