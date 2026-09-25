import type { OrderStatus } from '@/shared/types/database.types';

export interface DailySalesItem {
  date: string; // YYYY-MM-DD
  label: string; // e.g., "9/25 (금)"
  sales: number; // 실결제 매출액
  orderCount: number; // 주문 건수
}

export interface OrderStatusPipelineItem {
  status: OrderStatus;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface AdminSalesAnalyticsDTO {
  period: '7d' | '30d';
  dailyTrend: DailySalesItem[];
  totalPeriodSales: number;
  averageDailySales: number;
  maxDailySales: number;
  statusPipeline: OrderStatusPipelineItem[];
  totalOrdersInPipeline: number;
  generatedAt: string;
}

