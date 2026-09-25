import { Result, ok } from '@/core/domain/shared/Result';
import { DomainError } from '@/core/domain/shared/AppError';
import type { IOrderRepository } from '@/core/domain/order/repositories/IOrderRepository';
import type { IInquiryRepository } from '@/core/domain/cs/repositories/IInquiryRepository';
import type { AdminDashboardDTO } from '../dtos/AdminDashboardDTO';
import {
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  type OrderListItemDTO,
} from '@/core/application/order/dtos/OrderDTO';
import type { InquiryDTO } from '@/core/application/cs/use-cases/CreateInquiryUseCase';

export class GetAdminDashboardSummaryUseCase {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly inquiryRepo: IInquiryRepository
  ) {}

  public async execute(): Promise<Result<AdminDashboardDTO, DomainError>> {
    // 1. 주문 데이터 조회 (통계 집계용)
    const { orders, totalCount: totalOrdersCount } = await this.orderRepo.findMany({
      limit: 500,
    });

    // 오늘 0시 기준 시간 객체
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let totalRevenue = 0;
    let todayRevenue = 0;
    let todayOrdersCount = 0;
    let pendingReturnsCount = 0;
    let pendingCancelsCount = 0;

    for (const order of orders) {
      const isPaidOrActive =
        order.status === 'PAID' ||
        order.status === 'PREPARING' ||
        order.status === 'SHIPPING' ||
        order.status === 'DELIVERED' ||
        order.status === 'RETURN_REQUESTED';

      if (isPaidOrActive) {
        totalRevenue += order.totalPaidAmount.amount;
      }

      const orderCreatedDate = new Date(order.createdAt);
      if (orderCreatedDate >= startOfToday) {
        todayOrdersCount += 1;
        if (isPaidOrActive) {
          todayRevenue += order.totalPaidAmount.amount;
        }
      }

      if (order.status === 'RETURN_REQUESTED') {
        pendingReturnsCount += 1;
      } else if (order.status === 'CANCEL_REQUESTED') {
        pendingCancelsCount += 1;
      }
    }

    const pendingClaimsCount = pendingReturnsCount + pendingCancelsCount;

    // 최근 주문 5건 포맷팅
    const recentOrders: OrderListItemDTO[] = orders
      .slice(0, 5)
      .map((order) => {
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

    // 2. CS 문의 데이터 조회
    const { inquiries, totalCount: totalInquiriesCount } = await this.inquiryRepo.findMany({
      limit: 100,
    });

    const pendingInquiries = inquiries.filter((inq) => inq.status === 'PENDING');
    const pendingInquiriesCount = pendingInquiries.length;

    // 최근 미답변 문의 최대 3건 포맷팅
    const recentPendingInquiries: InquiryDTO[] = pendingInquiries.slice(0, 3).map((inq) => ({
      id: inq.id,
      customerId: inq.customerId,
      customerName: inq.customerName,
      customerEmail: inq.customerEmail,
      orderId: inq.orderId,
      category: inq.category,
      categoryLabel: inq.categoryLabel,
      title: inq.title,
      content: inq.content,
      status: inq.status,
      statusLabel: inq.statusLabel,
      answer: inq.answer,
      answeredAt: inq.answeredAt?.toISOString() ?? null,
      createdAt: inq.createdAt.toISOString(),
    }));

    const dashboardDTO: AdminDashboardDTO = {
      totalRevenue,
      todayRevenue,
      totalOrdersCount,
      todayOrdersCount,
      pendingClaimsCount,
      pendingReturnsCount,
      pendingCancelsCount,
      pendingInquiriesCount,
      totalInquiriesCount,
      recentOrders,
      recentPendingInquiries,
      generatedAt: now.toISOString(),
    };

    return ok(dashboardDTO);
  }
}
