import { Result, ok } from '@/core/domain/shared/Result';
import { DomainError } from '@/core/domain/shared/AppError';
import type { IOrderRepository } from '@/core/domain/order/repositories/IOrderRepository';
import type { OrderStatus } from '@/shared/types/database.types';
import {
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  type OrderListItemDTO,
} from '../dtos/OrderDTO';

export type AdminOrderFilterType =
  | 'ALL'
  | 'CLAIMS_ALL'
  | 'RETURN_REQUESTED'
  | 'CANCEL_REQUESTED'
  | 'CANCELLED'
  | 'RETURNED'
  | OrderStatus;

export interface GetAdminOrdersInput {
  filterType?: AdminOrderFilterType;
  searchQuery?: string;
  limit?: number;
  offset?: number;
}

export interface AdminOrdersResultDTO {
  orders: OrderListItemDTO[];
  totalCount: number;
}

/**
 * 관리자 주문 및 클레임 목록 조회 UseCase
 */
export class GetAdminOrdersUseCase {
  constructor(private readonly orderRepo: IOrderRepository) {}

  public async execute(
    input: GetAdminOrdersInput = {}
  ): Promise<Result<AdminOrdersResultDTO, DomainError>> {
    let status: OrderStatus | undefined;
    let statuses: OrderStatus[] | undefined;

    if (input.filterType && input.filterType !== 'ALL') {
      if (input.filterType === 'CLAIMS_ALL') {
        statuses = ['CANCEL_REQUESTED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURNED'];
      } else {
        status = input.filterType as OrderStatus;
      }
    }

    const { orders, totalCount } = await this.orderRepo.findMany({
      status,
      statuses,
      searchQuery: input.searchQuery,
      limit: input.limit ?? 20,
      offset: input.offset ?? 0,
    });

    const dtoList: OrderListItemDTO[] = orders.map((order) => {
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
        recipientName: order.shippingAddress.recipientName,
        recipientPhone: order.shippingAddress.recipientPhone,
        shippingAddress: order.shippingAddress.address,
        trackingCompany: order.trackingCompany ?? null,
        trackingNumber: order.trackingNumber ?? null,
        shippedAt: order.shippedAt ? order.shippedAt.toISOString() : null,
        deliveredAt: order.deliveredAt ? order.deliveredAt.toISOString() : null,
      };
    });

    return ok({
      orders: dtoList,
      totalCount,
    });
  }
}

