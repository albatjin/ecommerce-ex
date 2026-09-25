import type { Metadata } from 'next';
import {
  getAdminDashboardSummaryAction,
  getAdminSalesAnalyticsAction,
} from '@/app/actions/admin.actions';
import { AdminDashboardViewer } from '@/components/admin/AdminDashboardViewer';

export const metadata: Metadata = {
  title: '관리자 대시보드 | CommerceHub Admin',
  description: '매출, 주문, 클레임 및 고객 문의 실시간 통합 관리',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDashboardPage() {
  const [summaryResult, analyticsResult] = await Promise.all([
    getAdminDashboardSummaryAction(),
    getAdminSalesAnalyticsAction('7d'),
  ]);

  const defaultSummary = {
    totalRevenue: 0,
    todayRevenue: 0,
    totalOrdersCount: 0,
    todayOrdersCount: 0,
    pendingClaimsCount: 0,
    pendingReturnsCount: 0,
    pendingCancelsCount: 0,
    pendingInquiriesCount: 0,
    totalInquiriesCount: 0,
    recentOrders: [],
    recentPendingInquiries: [],
    generatedAt: new Date().toISOString(),
  };

  const defaultAnalytics = {
    period: '7d' as const,
    dailyTrend: [],
    totalPeriodSales: 0,
    averageDailySales: 0,
    maxDailySales: 0,
    statusPipeline: [],
    totalOrdersInPipeline: 0,
    generatedAt: new Date().toISOString(),
  };

  const dashboardData =
    summaryResult.success && summaryResult.data ? summaryResult.data : defaultSummary;
  const analyticsData =
    analyticsResult.success && analyticsResult.data ? analyticsResult.data : defaultAnalytics;

  return (
    <AdminDashboardViewer
      initialData={dashboardData}
      initialAnalytics={analyticsData}
    />
  );
}
