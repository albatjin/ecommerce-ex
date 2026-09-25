import type { Metadata } from 'next';
import { getAdminDashboardSummaryAction } from '@/app/actions/admin.actions';
import { AdminDashboardViewer } from '@/components/admin/AdminDashboardViewer';

export const metadata: Metadata = {
  title: '관리자 대시보드 | CommerceHub Admin',
  description: '매출, 주문, 클레임 및 고객 문의 실시간 통합 관리',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDashboardPage() {
  const result = await getAdminDashboardSummaryAction();

  const defaultData = {
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

  const dashboardData = result.success && result.data ? result.data : defaultData;

  return <AdminDashboardViewer initialData={dashboardData} />;
}
