import { Result, ok } from '@/core/domain/shared/Result';
import { DomainError } from '@/core/domain/shared/AppError';
import type { IOrderRepository } from '@/core/domain/order/repositories/IOrderRepository';
import type { OrderStatus } from '@/shared/types/database.types';
import type {
  AdminSalesAnalyticsDTO,
  DailySalesItem,
  OrderStatusPipelineItem,
} from '../dtos/AdminSalesAnalyticsDTO';

export interface GetAdminSalesAnalyticsInput {
  period?: '7d' | '30d';
  referenceDate?: Date;
}

const WEEKDAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

const PIPELINE_STATUSES: {
  status: OrderStatus;
  label: string;
  color: string;
}[] = [
  { status: 'PAID', label: '결제완료', color: 'bg-blue-500' },
  { status: 'PREPARING', label: '상품준비', color: 'bg-amber-500' },
  { status: 'SHIPPING', label: '배송중', color: 'bg-indigo-500' },
  { status: 'DELIVERED', label: '배송완료', color: 'bg-emerald-500' },
  { status: 'CANCEL_REQUESTED', label: '취소요청', color: 'bg-rose-400' },
  { status: 'CANCELLED', label: '주문취소', color: 'bg-rose-500' },
  { status: 'RETURN_REQUESTED', label: '반품요청', color: 'bg-purple-400' },
  { status: 'RETURNED', label: '반품완료', color: 'bg-slate-400' },
];

export class GetAdminSalesAnalyticsUseCase {
  constructor(private readonly orderRepo: IOrderRepository) {}

  public async execute(
    input: GetAdminSalesAnalyticsInput = {}
  ): Promise<Result<AdminSalesAnalyticsDTO, DomainError>> {
    const period = input.period ?? '7d';
    const dayCount = period === '30d' ? 30 : 7;
    const refDate = input.referenceDate ? new Date(input.referenceDate) : new Date();

    // 1. 기간 내 모든 날짜 슬롯 생성 (과거 -> 오늘 순)
    const dateMap = new Map<string, DailySalesItem>();
    const dateKeys: string[] = [];

    for (let i = dayCount - 1; i >= 0; i--) {
      const d = new Date(refDate);
      d.setDate(d.getDate() - i);

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      const weekday = WEEKDAY_NAMES[d.getDay()];
      const label = `${d.getMonth() + 1}/${d.getDate()} (${weekday})`;

      const item: DailySalesItem = {
        date: dateKey,
        label,
        sales: 0,
        orderCount: 0,
      };

      dateMap.set(dateKey, item);
      dateKeys.push(dateKey);
    }

    // 2. 전체 주문 데이터 조회
    const { orders } = await this.orderRepo.findMany({ limit: 1000 });

    // 파이프라인 카운트 맵 초기화
    const statusCounts = new Map<OrderStatus, number>();
    for (const p of PIPELINE_STATUSES) {
      statusCounts.set(p.status, 0);
    }

    let totalPeriodSales = 0;
    let maxDailySales = 0;

    for (const order of orders) {
      // 상태 카운트 집계
      const currentStatusCount = statusCounts.get(order.status) || 0;
      statusCounts.set(order.status, currentStatusCount + 1);

      // 주문 일자 확인
      const orderDate = new Date(order.createdAt);
      const year = orderDate.getFullYear();
      const month = String(orderDate.getMonth() + 1).padStart(2, '0');
      const day = String(orderDate.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;

      const slot = dateMap.get(dateKey);
      if (slot) {
        slot.orderCount += 1;

        const isEffectiveSale =
          order.status === 'PAID' ||
          order.status === 'PREPARING' ||
          order.status === 'SHIPPING' ||
          order.status === 'DELIVERED' ||
          order.status === 'RETURN_REQUESTED';

        if (isEffectiveSale) {
          slot.sales += order.totalPaidAmount.amount;
        }
      }
    }

    // 일별 트렌드 리스트 정리
    const dailyTrend: DailySalesItem[] = dateKeys.map((key) => {
      const item = dateMap.get(key)!;
      totalPeriodSales += item.sales;
      if (item.sales > maxDailySales) {
        maxDailySales = item.sales;
      }
      return item;
    });

    const averageDailySales =
      dayCount > 0 ? Math.round(totalPeriodSales / dayCount) : 0;

    // 주문 상태 파이프라인 항목 계산
    const totalOrdersInPipeline = orders.length;
    const statusPipeline: OrderStatusPipelineItem[] = PIPELINE_STATUSES.map((item) => {
      const count = statusCounts.get(item.status) || 0;
      const percentage =
        totalOrdersInPipeline > 0
          ? Math.round((count / totalOrdersInPipeline) * 1000) / 10
          : 0;

      return {
        status: item.status,
        label: item.label,
        count,
        percentage,
        color: item.color,
      };
    });

    return ok({
      period,
      dailyTrend,
      totalPeriodSales,
      averageDailySales,
      maxDailySales,
      statusPipeline,
      totalOrdersInPipeline,
      generatedAt: refDate.toISOString(),
    });
  }
}

