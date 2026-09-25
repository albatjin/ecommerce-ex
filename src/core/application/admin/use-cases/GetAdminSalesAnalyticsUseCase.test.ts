import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetAdminSalesAnalyticsUseCase } from './GetAdminSalesAnalyticsUseCase';
import type { IOrderRepository } from '@/core/domain/order/repositories/IOrderRepository';
import { Order } from '@/core/domain/order/entities/Order';
import { OrderItem } from '@/core/domain/order/entities/OrderItem';
import { OrderNumber } from '@/core/domain/order/value-objects/OrderNumber';
import { Money } from '@/core/domain/catalog/value-objects/Money';
import { ShippingAddress } from '@/core/domain/order/value-objects/ShippingAddress';
import { PaymentInfo } from '@/core/domain/order/value-objects/PaymentInfo';
import type { OrderStatus } from '@/shared/types/database.types';

describe('GetAdminSalesAnalyticsUseCase', () => {
  let mockOrderRepo: IOrderRepository;
  let useCase: GetAdminSalesAnalyticsUseCase;

  const createSampleOrder = (
    id: string,
    orderNum: string,
    status: OrderStatus,
    amount: number,
    createdAt: Date
  ) => {
    const item = OrderItem.create({
      productId: 'p-1',
      productName: '테스트 상품',
      unitPrice: Money.create(amount),
      quantity: 1,
      discountAmount: Money.zero(),
    }).getValue();

    const shipping = ShippingAddress.create({
      recipientName: '홍길동',
      recipientPhone: '010-1234-5678',
      address: '서울시 서초구',
      zipcode: '06500',
    }).getValue();

    const payment = PaymentInfo.create({
      method: 'CREDIT_CARD',
      status: 'COMPLETED',
      paidAt: createdAt,
    }).getValue();

    return Order.create(
      {
        orderNumber: OrderNumber.create(orderNum).getValue(),
        customerId: 'user-1',
        orderName: `주문 상품 ${id}`,
        items: [item],
        status,
        totalProductAmount: Money.create(amount),
        discountAmount: Money.zero(),
        pointUsed: Money.zero(),
        shippingFee: Money.zero(),
        totalPaidAmount: Money.create(amount),
        paymentInfo: payment,
        shippingAddress: shipping,
        createdAt,
        updatedAt: createdAt,
      },
      id
    ).getValue();
  };

  const fixedRefDate = new Date('2026-09-25T12:00:00.000Z');

  beforeEach(() => {
    const d0 = new Date('2026-09-25T05:00:00.000Z'); // 오늘
    const d1 = new Date('2026-09-24T05:00:00.000Z'); // 1일 전
    const d2 = new Date('2026-09-23T05:00:00.000Z'); // 2일 전

    const orders = [
      createSampleOrder('o-1', 'ORD-20260925-001', 'PAID', 100000, d0),
      createSampleOrder('o-2', 'ORD-20260925-002', 'SHIPPING', 50000, d0),
      createSampleOrder('o-3', 'ORD-20260924-001', 'DELIVERED', 80000, d1),
      createSampleOrder('o-4', 'ORD-20260924-002', 'CANCELLED', 40000, d1), // 취소건은 매출 미반영
      createSampleOrder('o-5', 'ORD-20260923-001', 'PREPARING', 60000, d2),
    ];

    mockOrderRepo = {
      findById: vi.fn(),
      findByOrderNumber: vi.fn(),
      findMany: vi.fn().mockResolvedValue({
        orders,
        totalCount: orders.length,
      }),
      save: vi.fn(),
      nextOrderNumber: vi.fn(),
    };

    useCase = new GetAdminSalesAnalyticsUseCase(mockOrderRepo);
  });

  it('기본 7일 기간의 일별 매출 추이와 집계 수치를 올바르게 계산한다', async () => {
    const result = await useCase.execute({
      period: '7d',
      referenceDate: fixedRefDate,
    });

    expect(result.isSuccess).toBe(true);
    const data = result.getValue();

    expect(data.period).toBe('7d');
    expect(data.dailyTrend).toHaveLength(7);

    // 마지막 날(2026-09-25)은 o-1(10만) + o-2(5만) = 150,000원, 주문 2건
    const lastDay = data.dailyTrend[6];
    expect(lastDay.date).toBe('2026-09-25');
    expect(lastDay.sales).toBe(150000);
    expect(lastDay.orderCount).toBe(2);

    // 1일 전(2026-09-24)은 o-3(8만) 유효 매출, o-4(취소 4만) 미반영 -> 80,000원, 주문 2건
    const prevDay = data.dailyTrend[5];
    expect(prevDay.date).toBe('2026-09-24');
    expect(prevDay.sales).toBe(80000);
    expect(prevDay.orderCount).toBe(2);

    // 총 유효 매출: 15만 + 8만 + 6만 = 290,000원
    expect(data.totalPeriodSales).toBe(290000);
    expect(data.maxDailySales).toBe(150000);
    expect(data.averageDailySales).toBe(Math.round(290000 / 7));
  });

  it('30일 기간 요청 시 30개의 일별 슬롯을 정확히 생성한다', async () => {
    const result = await useCase.execute({
      period: '30d',
      referenceDate: fixedRefDate,
    });

    expect(result.isSuccess).toBe(true);
    const data = result.getValue();

    expect(data.period).toBe('30d');
    expect(data.dailyTrend).toHaveLength(30);
    expect(data.averageDailySales).toBe(Math.round(290000 / 30));
  });

  it('주문 상태 파이프라인(PAID, SHIPPING, DELIVERED, CANCELLED 등)의 건수 및 점유율을 정확히 집계한다', async () => {
    const result = await useCase.execute({
      period: '7d',
      referenceDate: fixedRefDate,
    });

    const data = result.getValue();
    expect(data.totalOrdersInPipeline).toBe(5);

    const paidPipeline = data.statusPipeline.find((p) => p.status === 'PAID');
    expect(paidPipeline?.count).toBe(1);
    expect(paidPipeline?.percentage).toBe(20.0); // 1 / 5 = 20%

    const cancelledPipeline = data.statusPipeline.find((p) => p.status === 'CANCELLED');
    expect(cancelledPipeline?.count).toBe(1);
    expect(cancelledPipeline?.percentage).toBe(20.0);
  });
});

