import { Order } from '@/core/domain/order/entities/Order';
import { OrderItem } from '@/core/domain/order/entities/OrderItem';
import { OrderNumber } from '@/core/domain/order/value-objects/OrderNumber';
import { ShippingAddress } from '@/core/domain/order/value-objects/ShippingAddress';
import { PaymentInfo } from '@/core/domain/order/value-objects/PaymentInfo';
import { Money } from '@/core/domain/catalog/value-objects/Money';
import type { Database } from '@/shared/types/database.types';

type OrderRow = Database['public']['Tables']['orders']['Row'];
type OrderInsert = Database['public']['Tables']['orders']['Insert'];
type OrderItemRow = Database['public']['Tables']['order_items']['Row'];
type OrderItemInsert = Database['public']['Tables']['order_items']['Insert'];

export class OrderMapper {
  /**
   * DB의 orders 및 order_items Row를 Order Aggregate Root로 변환
   */
  public static toDomain(orderRow: OrderRow, itemRows: OrderItemRow[] = []): Order {
    const orderNumberResult = OrderNumber.create(orderRow.order_number);
    if (orderNumberResult.isFailure) {
      throw new Error(`주문번호 매핑 실패: ${orderNumberResult.getError().message}`);
    }

    const shippingAddressResult = ShippingAddress.create({
      recipientName: orderRow.recipient_name,
      recipientPhone: orderRow.recipient_phone,
      address: orderRow.shipping_address,
      zipcode: orderRow.shipping_zipcode,
      message: orderRow.shipping_message,
    });
    if (shippingAddressResult.isFailure) {
      throw new Error(`배송지 매핑 실패: ${shippingAddressResult.getError().message}`);
    }

    const paymentInfoResult = PaymentInfo.create({
      method: orderRow.payment_method,
      status: orderRow.payment_status,
      details: (orderRow.payment_details as Record<string, unknown>) ?? null,
      paidAt: orderRow.paid_at ? new Date(orderRow.paid_at) : null,
    });
    if (paymentInfoResult.isFailure) {
      throw new Error(`결제 정보 매핑 실패: ${paymentInfoResult.getError().message}`);
    }

    const items: OrderItem[] = itemRows.map((i) => {
      const itemResult = OrderItem.create(
        {
          productId: i.product_id,
          variantId: i.variant_id,
          productName: i.product_name,
          variantName: i.variant_name,
          productImageUrl: i.product_image_url,
          skuCode: i.sku_code,
          unitPrice: Money.create(i.unit_price),
          quantity: i.quantity,
          discountAmount: Money.create(i.discount_amount),
          totalPrice: Money.create(i.total_price),
          status: i.status,
          createdAt: new Date(i.created_at),
        },
        i.id
      );

      if (itemResult.isFailure) {
        throw new Error(`주문 품목 매핑 실패: ${itemResult.getError().message}`);
      }
      return itemResult.getValue();
    });

    const orderResult = Order.create(
      {
        orderNumber: orderNumberResult.getValue(),
        customerId: orderRow.customer_id,
        orderName: orderRow.order_name,
        items,
        status: orderRow.status,
        totalProductAmount: Money.create(orderRow.total_product_amount),
        discountAmount: Money.create(orderRow.discount_amount),
        pointUsed: Money.create(orderRow.point_used),
        shippingFee: Money.create(orderRow.shipping_fee),
        totalPaidAmount: Money.create(orderRow.total_paid_amount),
        paymentInfo: paymentInfoResult.getValue(),
        shippingAddress: shippingAddressResult.getValue(),
        trackingCompany: orderRow.tracking_company,
        trackingNumber: orderRow.tracking_number,
        paidAt: orderRow.paid_at ? new Date(orderRow.paid_at) : null,
        shippedAt: orderRow.shipped_at ? new Date(orderRow.shipped_at) : null,
        deliveredAt: orderRow.delivered_at ? new Date(orderRow.delivered_at) : null,
        cancelledAt: orderRow.cancelled_at ? new Date(orderRow.cancelled_at) : null,
        createdAt: new Date(orderRow.created_at),
        updatedAt: new Date(orderRow.updated_at),
      },
      orderRow.id
    );

    if (orderResult.isFailure) {
      throw new Error(`주문 엔티티 매핑 실패: ${orderResult.getError().message}`);
    }

    return orderResult.getValue();
  }

  /**
   * Order Aggregate Root를 DB orders 테이블 Insert/Update 객체로 변환
   */
  public static toOrderPersistence(order: Order): OrderInsert {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isUuid = (val?: string | null) => Boolean(val && UUID_REGEX.test(val));

    return {
      id: order.id,
      order_number: order.orderNumber.value,
      customer_id: isUuid(order.customerId) ? order.customerId! : null,
      order_name: order.orderName,
      status: order.status,
      total_product_amount: order.totalProductAmount.amount,
      discount_amount: order.discountAmount.amount,
      point_used: order.pointUsed.amount,
      shipping_fee: order.shippingFee.amount,
      total_paid_amount: order.totalPaidAmount.amount,
      payment_method: order.paymentInfo.method,
      payment_status: order.paymentInfo.status,
      payment_details: ((order.paymentInfo.details && Object.keys(order.paymentInfo.details).length > 0)
        ? (order.paymentInfo.details as unknown as Database['public']['Tables']['orders']['Insert']['payment_details'])
        : ({} as unknown as Database['public']['Tables']['orders']['Insert']['payment_details'])),
      recipient_name: order.shippingAddress.recipientName,
      recipient_phone: order.shippingAddress.recipientPhone,
      shipping_address: order.shippingAddress.address,
      shipping_zipcode: order.shippingAddress.zipcode,
      shipping_message: order.shippingAddress.message ?? null,
      tracking_company: order.trackingCompany ?? null,
      tracking_number: order.trackingNumber ?? null,
      paid_at: order.paidAt?.toISOString() ?? null,
      shipped_at: order.shippedAt?.toISOString() ?? null,
      delivered_at: order.deliveredAt?.toISOString() ?? null,
      cancelled_at: order.cancelledAt?.toISOString() ?? null,
      created_at: order.createdAt.toISOString(),
      updated_at: order.updatedAt.toISOString(),
    };
  }

  /**
   * OrderItem 엔티티들을 DB order_items 테이블 Insert 객체 배열로 변환
   */
  public static toItemPersistenceList(orderId: string, items: OrderItem[]): OrderItemInsert[] {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isUuid = (val?: string | null) => Boolean(val && UUID_REGEX.test(val));

    return items.map((item) => ({
      id: item.id,
      order_id: orderId,
      product_id: isUuid(item.productId) ? item.productId! : null,
      variant_id: isUuid(item.variantId) ? item.variantId! : null,
      product_name: item.productName,
      variant_name: item.variantName ?? null,
      product_image_url: item.productImageUrl ?? null,
      sku_code: item.skuCode ?? null,
      unit_price: item.unitPrice.amount,
      quantity: item.quantity,
      discount_amount: item.discountAmount.amount,
      total_price: item.totalPrice.amount,
      status: item.status,
      created_at: item.createdAt.toISOString(),
    }));
  }
}
