import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateOrderDeliveryUseCase } from './UpdateOrderDeliveryUseCase';
import { Order } from '@/core/domain/order/entities/Order';
import { OrderItem } from '@/core/domain/order/entities/OrderItem';
import { OrderNumber } from '@/core/domain/order/value-objects/OrderNumber';
import { ShippingAddress } from '@/core/domain/order/value-objects/ShippingAddress';
import { PaymentInfo } from '@/core/domain/order/value-objects/PaymentInfo';
import { Money } from '@/core/domain/catalog/value-objects/Money';
import type { IOrderRepository } from '@/core/domain/order/repositories/IOrderRepository';
import type { OrderStatus } from '@/shared/types/database.types';

describe('UpdateOrderDeliveryUseCase', () => {
  let mockOrderRepo: IOrderRepository;
  let useCase: UpdateOrderDeliveryUseCase;

  const createSampleOrder = (status: OrderStatus = 'PAID', tracking?: { company: string; number: string }) => {
    const item = OrderItem.create({
      productId: 'prod-1',
      productName: '테스트 상품',
      unitPrice: Money.create(30000),
      quantity: 1,
      discountAmount: Money.zero(),
    }, 'item-1').getValue();

    const shipping = ShippingAddress.create({
      recipientName: '홍길동',
      recipientPhone: '010-1234-5678',
      address: '서울시 강남구 테헤란로 123',
      zipcode: '06234',
    }).getValue();

    const payment = PaymentInfo.create({
      method: 'CREDIT_CARD',
      status: 'COMPLETED',
      paidAt: new Date(),
    }).getValue();

    return Order.create(
      {
        orderNumber: OrderNumber.create('ORD-20260925-00101').getValue(),
        customerId: 'user-1',
        orderName: '테스트 주문',
        items: [item],
        status,
        totalProductAmount: Money.create(30000),
        discountAmount: Money.zero(),
        pointUsed: Money.zero(),
        shippingFee: Money.create(3000),
        totalPaidAmount: Money.create(33000),
        paymentInfo: payment,
        shippingAddress: shipping,
        trackingCompany: tracking?.company ?? null,
        trackingNumber: tracking?.number ?? null,
        paidAt: new Date(),
        shippedAt: status === 'SHIPPING' || status === 'DELIVERED' ? new Date() : null,
        deliveredAt: status === 'DELIVERED' ? new Date() : null,
      },
      'order-101'
    ).getValue();
  };

  beforeEach(() => {
    mockOrderRepo = {
      findById: vi.fn(),
      findByOrderNumber: vi.fn(),
      findMany: vi.fn(),
      save: vi.fn(),
      nextOrderNumber: vi.fn(),
    };
    useCase = new UpdateOrderDeliveryUseCase(mockOrderRepo);
  });

  it('결제완료(PAID) 주문을 배송준비(PREPARING) 상태로 전환한다', async () => {
    const order = createSampleOrder('PAID');
    vi.mocked(mockOrderRepo.findById).mockResolvedValueOnce(order);

    const result = await useCase.execute({
      orderId: 'order-101',
      targetStatus: 'PREPARING',
    });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().status).toBe('PREPARING');
    expect(result.getValue().statusLabel).toBe('배송 준비 중');
    expect(mockOrderRepo.save).toHaveBeenCalledWith(order);
  });

  it('배송준비(PREPARING) 주문에 택배사와 송장번호를 등록하여 배송중(SHIPPING)으로 전환한다', async () => {
    const order = createSampleOrder('PREPARING');
    vi.mocked(mockOrderRepo.findById).mockResolvedValueOnce(order);

    const result = await useCase.execute({
      orderId: 'order-101',
      targetStatus: 'SHIPPING',
      trackingCompany: 'CJ대한통운',
      trackingNumber: '68392019482',
    });

    expect(result.isSuccess).toBe(true);
    const data = result.getValue();
    expect(data.status).toBe('SHIPPING');
    expect(data.statusLabel).toBe('배송 중');
    expect(data.trackingCompany).toBe('CJ대한통운');
    expect(data.trackingNumber).toBe('68392019482');
    expect(data.shippedAt).toBeTruthy();
    expect(mockOrderRepo.save).toHaveBeenCalledWith(order);
  });

  it('배송중(SHIPPING) 주문의 송장번호 정보를 수정한다', async () => {
    const order = createSampleOrder('SHIPPING', { company: 'CJ대한통운', number: '111111' });
    vi.mocked(mockOrderRepo.findById).mockResolvedValueOnce(order);

    const result = await useCase.execute({
      orderId: 'order-101',
      targetStatus: 'SHIPPING',
      trackingCompany: '우체국택배',
      trackingNumber: '999999',
    });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().trackingCompany).toBe('우체국택배');
    expect(result.getValue().trackingNumber).toBe('999999');
    expect(mockOrderRepo.save).toHaveBeenCalledWith(order);
  });

  it('배송중(SHIPPING) 주문을 배송완료(DELIVERED) 상태로 전환한다', async () => {
    const order = createSampleOrder('SHIPPING', { company: 'CJ대한통운', number: '111111' });
    vi.mocked(mockOrderRepo.findById).mockResolvedValueOnce(order);

    const result = await useCase.execute({
      orderId: 'order-101',
      targetStatus: 'DELIVERED',
    });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().status).toBe('DELIVERED');
    expect(result.getValue().statusLabel).toBe('배송 완료');
    expect(result.getValue().deliveredAt).toBeTruthy();
    expect(mockOrderRepo.save).toHaveBeenCalledWith(order);
  });

  it('배송 시작 시 택배사 또는 송장번호가 누락되면 에러를 반환한다', async () => {
    const order = createSampleOrder('PREPARING');
    vi.mocked(mockOrderRepo.findById).mockResolvedValueOnce(order);

    const result = await useCase.execute({
      orderId: 'order-101',
      targetStatus: 'SHIPPING',
      trackingCompany: '',
      trackingNumber: '',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError().message).toContain('택배사와 송장 번호는 필수');
    expect(mockOrderRepo.save).not.toHaveBeenCalled();
  });

  it('유효하지 않은 상태 전이 시 에러를 반환한다 (예: 결제완료에서 바로 배송완료 시도)', async () => {
    const order = createSampleOrder('PAID');
    vi.mocked(mockOrderRepo.findById).mockResolvedValueOnce(order);

    const result = await useCase.execute({
      orderId: 'order-101',
      targetStatus: 'DELIVERED',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError().message).toContain('배송 중');
    expect(mockOrderRepo.save).not.toHaveBeenCalled();
  });

  it('존재하지 않는 주문 ID 전달 시 에러를 반환한다', async () => {
    vi.mocked(mockOrderRepo.findById).mockResolvedValueOnce(null);

    const result = await useCase.execute({
      orderId: 'non-existing',
      targetStatus: 'PREPARING',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError().message).toContain('찾을 수 없습니다');
  });
});
