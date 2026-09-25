import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetAdminDashboardSummaryUseCase } from './GetAdminDashboardSummaryUseCase';
import type { IOrderRepository } from '@/core/domain/order/repositories/IOrderRepository';
import type { IInquiryRepository } from '@/core/domain/cs/repositories/IInquiryRepository';
import { Order } from '@/core/domain/order/entities/Order';
import { OrderItem } from '@/core/domain/order/entities/OrderItem';
import { OrderNumber } from '@/core/domain/order/value-objects/OrderNumber';
import { Money } from '@/core/domain/catalog/value-objects/Money';
import { ShippingAddress } from '@/core/domain/order/value-objects/ShippingAddress';
import { PaymentInfo } from '@/core/domain/order/value-objects/PaymentInfo';
import { Inquiry } from '@/core/domain/cs/entities/Inquiry';
import type { OrderStatus } from '@/shared/types/database.types';

describe('GetAdminDashboardSummaryUseCase', () => {
  let mockOrderRepo: IOrderRepository;
  let mockInquiryRepo: IInquiryRepository;
  let useCase: GetAdminDashboardSummaryUseCase;

  const createSampleOrder = (
    id: string,
    orderNum: string,
    status: OrderStatus,
    amount: number,
    createdAt: Date
  ) => {
    const item = OrderItem.create({
      productId: 'p-1',
      productName: '상품 1',
      unitPrice: Money.create(amount),
      quantity: 1,
      discountAmount: Money.zero(),
    }).getValue();

    const shipping = ShippingAddress.create({
      recipientName: '홍길동',
      recipientPhone: '010-1234-5678',
      address: '서울시 강남구',
      zipcode: '06000',
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

  const createSampleInquiry = (
    id: string,
    title: string,
    status: 'PENDING' | 'ANSWERED',
    answer: string | null = null
  ) => {
    return Inquiry.create(
      {
        customerId: 'user-1',
        customerName: '홍길동',
        customerEmail: 'user@example.com',
        category: 'ORDER',
        title,
        content: '문의 상세 내용입니다.',
        status,
        answer,
        answeredAt: answer ? new Date() : null,
      },
      id
    ).getValue();
  };

  beforeEach(() => {
    const today = new Date();
    const yesterday = new Date(Date.now() - 86400000);

    const orders = [
      createSampleOrder('o-1', 'ORD-20260925-00001', 'PAID', 50000, today),
      createSampleOrder('o-2', 'ORD-20260925-00002', 'RETURN_REQUESTED', 30000, today),
      createSampleOrder('o-3', 'ORD-20260924-00001', 'DELIVERED', 70000, yesterday),
      createSampleOrder('o-4', 'ORD-20260924-00002', 'CANCELLED', 20000, yesterday),
      createSampleOrder('o-5', 'ORD-20260924-00003', 'CANCEL_REQUESTED', 15000, yesterday),
    ];

    const inquiries = [
      createSampleInquiry('inq-1', '배송 문의 1', 'PENDING'),
      createSampleInquiry('inq-2', '반품 문의 2', 'PENDING'),
      createSampleInquiry('inq-3', '결제 완료 문의 3', 'ANSWERED', '답변 완료되었습니다.'),
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

    mockInquiryRepo = {
      findById: vi.fn(),
      findByCustomerId: vi.fn(),
      findMany: vi.fn().mockResolvedValue({
        inquiries,
        totalCount: inquiries.length,
      }),
      save: vi.fn(),
    };

    useCase = new GetAdminDashboardSummaryUseCase(mockOrderRepo, mockInquiryRepo);
  });

  it('4대 핵심 KPI 지표(총 매출액, 오늘 매출, 주문 수, 대기 클레임 수, 미답변 문의 수)를 정확히 집계한다', async () => {
    const result = await useCase.execute();

    expect(result.isSuccess).toBe(true);
    const summary = result.getValue();

    // 총 매출액: o-1(50000) + o-2(30000) + o-3(70000) = 150000 (CANCELLED, CANCEL_REQUESTED 제외)
    expect(summary.totalRevenue).toBe(150000);

    // 오늘 매출액: o-1(50000) + o-2(30000) = 80000
    expect(summary.todayRevenue).toBe(80000);

    // 주문 건수
    expect(summary.totalOrdersCount).toBe(5);
    expect(summary.todayOrdersCount).toBe(2);

    // 클레임 검수 대기 (RETURN_REQUESTED: 1, CANCEL_REQUESTED: 1 -> 총 2건)
    expect(summary.pendingReturnsCount).toBe(1);
    expect(summary.pendingCancelsCount).toBe(1);
    expect(summary.pendingClaimsCount).toBe(2);

    // 문의 통계 (전체 3건 중 PENDING 2건)
    expect(summary.totalInquiriesCount).toBe(3);
    expect(summary.pendingInquiriesCount).toBe(2);
  });

  it('최근 주문 5건과 답변 대기 문의 목록을 정상 포맷팅하여 반환한다', async () => {
    const result = await useCase.execute();
    const summary = result.getValue();

    expect(summary.recentOrders).toHaveLength(5);
    expect(summary.recentOrders[0].orderNumber).toBe('ORD-20260925-00001');

    expect(summary.recentPendingInquiries).toHaveLength(2);
    expect(summary.recentPendingInquiries[0].title).toBe('배송 문의 1');
    expect(summary.recentPendingInquiries[0].status).toBe('PENDING');
  });
});
