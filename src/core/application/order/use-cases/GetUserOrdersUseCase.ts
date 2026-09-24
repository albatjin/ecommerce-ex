import { Result, ok, fail } from '@/core/domain/shared/Result';
import { DomainError } from '@/core/domain/shared/AppError';
import type { IOrderRepository } from '@/core/domain/order/repositories/IOrderRepository';
import type { OrderStatus } from '@/shared/types/database.types';
import {
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  type UserOrdersResultDTO,
} from '../dtos/OrderDTO';

export interface GetUserOrdersInput {
  customerId: string;
  status?: OrderStatus;
  limit?: number;
  offset?: number;
}

/**
 * 고객의 주문 목록 조회 UseCase (마이페이지 주문 내역용)
 */
export class GetUserOrdersUseCase {
  constructor(private readonly orderRepo: IOrderRepository) {}

  public async execute(
    input: GetUserOrdersInput
  ): Promise<Result<UserOrdersResultDTO, DomainError>> {
    if (!input.customerId || !input.customerId.trim()) {
      return fail(new DomainError('고객 식별자가 필요합니다.'));
    }

    const { orders, totalCount } = await this.orderRepo.findMany({
      customerId: input.customerId,
      status: input.status,
      limit: input.limit ?? 20,
      offset: input.offset ?? 0,
    });

    const dtoList = orders.map((order) => {
      const firstItem = order.items[0];
      return {
        id: order.id,
        orderNumber: order.orderNumber.value,
        orderName: order.orderName,
        status: order.status,
        statusLabel: ORDER_STATUS_LABELS[order.status] || order.status,
        itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
        firstItemImageUrl: firstItem?.productImageUrl || null,
        totalPaidAmount: order.totalPaidAmount.amount,
        paymentMethodLabel:
          PAYMENT_METHOD_LABELS[order.paymentInfo.method] || order.paymentInfo.method,
        createdAt: order.createdAt.toISOString(),
      };
    });

    return ok({
      orders: dtoList,
      totalCount,
    });
  }
}

