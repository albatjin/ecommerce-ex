import { describe, it, expect } from 'vitest';
import { OrderMapper } from './OrderMapper';
import { Order } from '@/core/domain/order/entities/Order';
import { OrderItem } from '@/core/domain/order/entities/OrderItem';
import { OrderNumber } from '@/core/domain/order/value-objects/OrderNumber';
import { ShippingAddress } from '@/core/domain/order/value-objects/ShippingAddress';
import { PaymentInfo } from '@/core/domain/order/value-objects/PaymentInfo';
import { Money } from '@/core/domain/catalog/value-objects/Money';

describe('OrderMapper', () => {
  const sampleOrderRow = {
    id: 'order-1',
    order_number: 'ORD-20260924-ABCDE',
    customer_id: 'user-1',
    order_name: '오크 다이닝 체어 외 1건',
    status: 'PAID' as const,
    total_product_amount: 150000,
    discount_amount: 10000,
    point_used: 5000,
    shipping_fee: 0,
    total_paid_amount: 135000,
    payment_method: 'CREDIT_CARD' as const,
    payment_status: 'COMPLETED' as const,
    payment_details: { cardCompany: '신한카드' },
    recipient_name: '홍길동',
    recipient_phone: '010-1234-5678',
    shipping_address: '서울특별시 강남구 테헤란로 123',
    shipping_zipcode: '06234',
    shipping_message: '부재 시 경비실',
    tracking_company: null,
    tracking_number: null,
    paid_at: '2026-09-24T12:00:00.000Z',
    shipped_at: null,
    delivered_at: null,
    cancelled_at: null,
    created_at: '2026-09-24T11:50:00.000Z',
    updated_at: '2026-09-24T12:00:00.000Z',
  };

  const sampleItemRows = [
    {
      id: 'item-1',
      order_id: 'order-1',
      product_id: 'prod-1',
      variant_id: 'var-1',
      product_name: '오크 다이닝 체어',
      variant_name: '월넛',
      product_image_url: 'https://example.com/chair.jpg',
      sku_code: 'CHAIR-WAL',
      unit_price: 150000,
      quantity: 1,
      discount_amount: 10000,
      total_price: 140000,
      status: 'ORDERED' as const,
      created_at: '2026-09-24T11:50:00.000Z',
    },
  ];

  it('toDomain: DB Row 데이터를 도메인 Order 엔티티 및 자식 엔티티로 매핑한다', () => {
    const order = OrderMapper.toDomain(sampleOrderRow, sampleItemRows);

    expect(order.id).toBe('order-1');
    expect(order.orderNumber.value).toBe('ORD-20260924-ABCDE');
    expect(order.orderName).toBe('오크 다이닝 체어 외 1건');
    expect(order.status).toBe('PAID');
    expect(order.totalPaidAmount.amount).toBe(135000);
    expect(order.shippingAddress.recipientName).toBe('홍길동');
    expect(order.paymentInfo.isCompleted()).toBe(true);

    expect(order.items).toHaveLength(1);
    expect(order.items[0].productName).toBe('오크 다이닝 체어');
    expect(order.items[0].totalPrice.amount).toBe(140000);
  });

  it('toOrderPersistence & toItemPersistenceList: 도메인 엔티티를 DB Row Insert 형식으로 변환한다', () => {
    const item = OrderItem.create({
      productId: 'prod-1',
      productName: '상품 1',
      unitPrice: Money.create(50000),
      quantity: 1,
      discountAmount: Money.zero(),
    }).getValue();

    const order = Order.create({
      orderNumber: OrderNumber.create('ORD-20260924-12345').getValue(),
      customerId: 'user-1',
      orderName: '상품 1',
      items: [item],
      status: 'PAYMENT_PENDING',
      totalProductAmount: Money.create(50000),
      discountAmount: Money.zero(),
      pointUsed: Money.zero(),
      shippingFee: Money.create(3000),
      paymentInfo: PaymentInfo.createPending('NAVER_PAY'),
      shippingAddress: ShippingAddress.create({
        recipientName: '이순신',
        recipientPhone: '010-9876-5432',
        address: '부산시 해운대구',
        zipcode: '48000',
      }).getValue(),
    }).getValue();

    const orderPersistence = OrderMapper.toOrderPersistence(order);
    expect(orderPersistence.order_number).toBe('ORD-20260924-12345');
    expect(orderPersistence.recipient_name).toBe('이순신');
    expect(orderPersistence.payment_method).toBe('NAVER_PAY');

    const itemPersistenceList = OrderMapper.toItemPersistenceList(order.id, order.items);
    expect(itemPersistenceList).toHaveLength(1);
    expect(itemPersistenceList[0].product_name).toBe('상품 1');
    expect(itemPersistenceList[0].total_price).toBe(50000);
  });
});
