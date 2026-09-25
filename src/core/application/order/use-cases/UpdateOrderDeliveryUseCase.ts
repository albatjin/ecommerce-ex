import { Result, ok, fail } from '@/core/domain/shared/Result';
import { DomainError } from '@/core/domain/shared/AppError';
import type { IOrderRepository } from '@/core/domain/order/repositories/IOrderRepository';
import type { OrderStatus } from '@/shared/types/database.types';
import { ORDER_STATUS_LABELS } from '../dtos/OrderDTO';

export interface UpdateOrderDeliveryInput {
  orderId: string;
  targetStatus: 'PREPARING' | 'SHIPPING' | 'DELIVERED';
  trackingCompany?: string;
  trackingNumber?: string;
}

export interface UpdateOrderDeliveryOutput {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  statusLabel: string;
  trackingCompany?: string | null;
  trackingNumber?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
}

/**
 * 주문 배송 상태 단계별 변경 및 송장 번호 등록 UseCase
 */
export class UpdateOrderDeliveryUseCase {
  constructor(private readonly orderRepo: IOrderRepository) {}

  public async execute(
    input: UpdateOrderDeliveryInput
  ): Promise<Result<UpdateOrderDeliveryOutput, DomainError>> {
    const order = await this.orderRepo.findById(input.orderId);
    if (!order) {
      return fail(new DomainError(`해당 주문(ID: ${input.orderId})을 찾을 수 없습니다.`));
    }

    if (input.targetStatus === 'PREPARING') {
      const result = order.markAsPreparing();
      if (result.isFailure) {
        return fail(result.getError());
      }
    } else if (input.targetStatus === 'SHIPPING') {
      const company = input.trackingCompany?.trim();
      const number = input.trackingNumber?.trim();

      if (!company || !number) {
        return fail(new DomainError('배송 처리를 위해 택배사와 송장 번호는 필수 입력 항목입니다.'));
      }

      if (order.status === 'SHIPPING') {
        const updateResult = order.updateTracking(company, number);
        if (updateResult.isFailure) {
          return fail(updateResult.getError());
        }
      } else {
        const shipResult = order.markAsShipping(company, number);
        if (shipResult.isFailure) {
          return fail(shipResult.getError());
        }
      }
    } else if (input.targetStatus === 'DELIVERED') {
      const delivResult = order.markAsDelivered();
      if (delivResult.isFailure) {
        return fail(delivResult.getError());
      }
    } else {
      return fail(new DomainError(`지원되지 않는 배송 상태 변경 요청입니다: ${input.targetStatus}`));
    }

    await this.orderRepo.save(order);

    return ok({
      orderId: order.id,
      orderNumber: order.orderNumber.value,
      status: order.status,
      statusLabel: ORDER_STATUS_LABELS[order.status] || order.status,
      trackingCompany: order.trackingCompany ?? null,
      trackingNumber: order.trackingNumber ?? null,
      shippedAt: order.shippedAt ? order.shippedAt.toISOString() : null,
      deliveredAt: order.deliveredAt ? order.deliveredAt.toISOString() : null,
    });
  }
}
