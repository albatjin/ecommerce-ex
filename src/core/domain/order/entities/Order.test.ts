import { describe, it, expect } from 'vitest';
import { Order } from './Order';
import { OrderItem } from './OrderItem';
import { OrderNumber } from '../value-objects/OrderNumber';
import { ShippingAddress } from '../value-objects/ShippingAddress';
import { PaymentInfo } from '../value-objects/PaymentInfo';
import { Money } from '../../catalog/value-objects/Money';

describe('Order Aggregate Root & Status State Machine', () => {
  const createSampleOrder = () => {
    const item = OrderItem.create({
      productId: 'prod-1',
      productName: '프리미엄 셔츠',
      unitPrice: Money.create(50000),
      quantity: 2,
      discountAmount: Money.create(5000),
    }).getValue();

    const address = ShippingAddress.create({
      recipientName: '홍길동',
      recipientPhone: '010-1234-5678',
      address: '서울시 강남구 테헤란로 123',
      zipcode: '12345',
    }).getValue();

    const payment = PaymentInfo.createPending('CREDIT_CARD');

    return Order.create({
      orderNumber: OrderNumber.generate(),
      customerId: 'user-1',
      orderName: '프리미엄 셔츠 2개',
      items: [item],
      status: 'PAYMENT_PENDING',
      totalProductAmount: Money.create(100000),
      discountAmount: Money.create(5000),
      pointUsed: Money.create(3000),
      shippingFee: Money.create(3000),
      paymentInfo: payment,
      shippingAddress: address,
    }).getValue();
  };

  it('주문 엔티티를 정상 생성하고 총 실결제 금액(상품-할인-적립금+배송비)을 정합성 있게 계산한다', () => {
    const order = createSampleOrder();

    // 100,000 - 5,000 - 3,000 + 3,000 = 95,000원
    expect(order.totalPaidAmount.amount).toBe(95000);
    expect(order.status).toBe('PAYMENT_PENDING');
    expect(order.items).toHaveLength(1);
  });

  describe('정상 주문 라이프사이클 상태 전이 (Happy Path)', () => {
    it('PAYMENT_PENDING -> PAID -> PREPARING -> SHIPPING -> DELIVERED 흐름이 정상 동작한다', () => {
      const order = createSampleOrder();

      // 1. 결제 완료 (markAsPaid)
      const paidResult = order.markAsPaid(new Date());
      expect(paidResult.isSuccess).toBe(true);
      expect(order.status).toBe('PAID');
      expect(order.paymentInfo.isCompleted()).toBe(true);
      expect(order.items[0].status).toBe('ORDERED');

      // 2. 상품 준비 중 (markAsPreparing)
      const prepResult = order.markAsPreparing();
      expect(prepResult.isSuccess).toBe(true);
      expect(order.status).toBe('PREPARING');
      expect(order.items[0].status).toBe('PREPARING');

      // 3. 배송 시작 (markAsShipping)
      const shipResult = order.markAsShipping('CJ대한통운', '1234567890');
      expect(shipResult.isSuccess).toBe(true);
      expect(order.status).toBe('SHIPPING');
      expect(order.trackingCompany).toBe('CJ대한통운');
      expect(order.trackingNumber).toBe('1234567890');
      expect(order.items[0].status).toBe('SHIPPED');

      // 4. 배송 완료 (markAsDelivered)
      const deliverResult = order.markAsDelivered();
      expect(deliverResult.isSuccess).toBe(true);
      expect(order.status).toBe('DELIVERED');
      expect(order.items[0].status).toBe('DELIVERED');
    });
  });

  describe('취소 및 반품 플로우', () => {
    it('결제 대기 중인 주문은 즉시 취소할 수 있다', () => {
      const order = createSampleOrder();
      const cancelResult = order.cancel();

      expect(cancelResult.isSuccess).toBe(true);
      expect(order.status).toBe('CANCELLED');
      expect(order.items[0].status).toBe('CANCELLED');
    });

    it('결제 완료된 주문은 취소 요청 후 취소 확정 및 환불 상태로 변경된다', () => {
      const order = createSampleOrder();
      order.markAsPaid();

      // 취소 요청
      const reqResult = order.requestCancel();
      expect(reqResult.isSuccess).toBe(true);
      expect(order.status).toBe('CANCEL_REQUESTED');

      // 취소 확정
      const confirmResult = order.cancel();
      expect(confirmResult.isSuccess).toBe(true);
      expect(order.status).toBe('CANCELLED');
      expect(order.paymentInfo.status).toBe('REFUNDED');
    });

    it('배송 완료된 주문은 반품 요청 후 반품 완료 및 환불 상태로 변경된다', () => {
      const order = createSampleOrder();
      order.markAsPaid();
      order.markAsPreparing();
      order.markAsShipping('한진택배', '987654321');
      order.markAsDelivered();

      // 배송 완료 후 바로 취소 불가
      const invalidCancel = order.cancel();
      expect(invalidCancel.isFailure).toBe(true);

      // 반품 요청
      const returnReq = order.requestReturn();
      expect(returnReq.isSuccess).toBe(true);
      expect(order.status).toBe('RETURN_REQUESTED');

      // 반품 완료
      const returnComplete = order.completeReturn();
      expect(returnComplete.isSuccess).toBe(true);
      expect(order.status).toBe('RETURNED');
      expect(order.paymentInfo.status).toBe('REFUNDED');
    });
  });

  describe('상태 전이 유효성 검증 및 예외 차단', () => {
    it('결제되지 않은 상태에서 배송을 시작할 수 없다', () => {
      const order = createSampleOrder();
      const result = order.markAsShipping('CJ대한통운', '1111');

      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('준비 중');
    });

    it('송장 정보가 누락되면 배송 시작이 거부된다', () => {
      const order = createSampleOrder();
      order.markAsPaid();

      const emptyTracking = order.markAsShipping('', '');
      expect(emptyTracking.isFailure).toBe(true);
      expect(emptyTracking.getError().message).toContain('필수 입력');
    });
  });
});

