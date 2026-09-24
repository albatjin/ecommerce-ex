import { Result, ok, fail } from '@/core/domain/shared/Result';
import { DomainError } from '@/core/domain/shared/AppError';
import type { IOrderRepository } from '@/core/domain/order/repositories/IOrderRepository';
import {
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  type OrderDetailDTO,
} from '../dtos/OrderDTO';

/**
 * 주문 단건 상세 조회 UseCase (ID 또는 주문 번호 기반)
 */
export class GetOrderUseCase {
  constructor(private readonly orderRepo: IOrderRepository) {}

  public async execute(params: {
    orderId?: string;
    orderNumber?: string;
    customerId?: string | null;
  }): Promise<Result<OrderDetailDTO, DomainError>> {
    let order = null;

    if (params.orderId) {
      order = await this.orderRepo.findById(params.orderId);
    } else if (params.orderNumber) {
      order = await this.orderRepo.findByOrderNumber(params.orderNumber);
    } else {
      return fail(new DomainError('주문 ID 또는 주문 번호가 필요합니다.'));
    }

    if (!order) {
      return fail(new DomainError('해당 주문을 찾을 수 없습니다.'));
    }

    // 고객 본인의 주문인지 확인 (회원인 경우)
    if (params.customerId && order.customerId && order.customerId !== params.customerId) {
      return fail(new DomainError('해당 주문의 조회 권한이 없습니다.'));
    }

    const dto: OrderDetailDTO = {
      id: order.id,
      orderNumber: order.orderNumber.value,
      customerId: order.customerId,
      orderName: order.orderName,
      status: order.status,
      statusLabel: ORDER_STATUS_LABELS[order.status] || order.status,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        productName: item.productName,
        variantName: item.variantName,
        productImageUrl: item.productImageUrl,
        skuCode: item.skuCode,
        unitPrice: item.unitPrice.amount,
        quantity: item.quantity,
        discountAmount: item.discountAmount.amount,
        totalPrice: item.totalPrice.amount,
        status: item.status,
      })),
      totalProductAmount: order.totalProductAmount.amount,
      discountAmount: order.discountAmount.amount,
      pointUsed: order.pointUsed.amount,
      shippingFee: order.shippingFee.amount,
      totalPaidAmount: order.totalPaidAmount.amount,
      payment: {
        method: order.paymentInfo.method,
        methodLabel: PAYMENT_METHOD_LABELS[order.paymentInfo.method] || order.paymentInfo.method,
        status: order.paymentInfo.status,
        details: order.paymentInfo.details,
        paidAt: order.paidAt?.toISOString() || null,
      },
      shippingAddress: {
        recipientName: order.shippingAddress.recipientName,
        recipientPhone: order.shippingAddress.recipientPhone,
        address: order.shippingAddress.address,
        zipcode: order.shippingAddress.zipcode,
        message: order.shippingAddress.message,
      },
      tracking: {
        company: order.trackingCompany,
        number: order.trackingNumber,
      },
      createdAt: order.createdAt.toISOString(),
      paidAt: order.paidAt?.toISOString() || null,
      shippedAt: order.shippedAt?.toISOString() || null,
      deliveredAt: order.deliveredAt?.toISOString() || null,
      cancelledAt: order.cancelledAt?.toISOString() || null,
    };

    return ok(dto);
  }
}

