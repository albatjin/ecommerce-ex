import type { OrderListItemDTO } from '@/core/application/order/dtos/OrderDTO';
import type { InquiryDTO } from '@/core/application/cs/use-cases/CreateInquiryUseCase';

export interface AdminKPICardData {
  title: string;
  primaryValue: string | number;
  secondaryLabel?: string;
  secondaryValue?: string | number;
  trendLabel?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  badgeColor?: 'blue' | 'emerald' | 'amber' | 'rose' | 'indigo';
}

export interface AdminDashboardDTO {
  // 4대 핵심 KPI 지표
  totalRevenue: number;
  todayRevenue: number;
  totalOrdersCount: number;
  todayOrdersCount: number;
  pendingClaimsCount: number;
  pendingReturnsCount: number;
  pendingCancelsCount: number;
  pendingInquiriesCount: number;
  totalInquiriesCount: number;

  // 실시간 운영 위젯용 데이터
  recentOrders: OrderListItemDTO[];
  recentPendingInquiries: InquiryDTO[];

  // 타임스탬프
  generatedAt: string;
}
