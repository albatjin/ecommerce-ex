import type { Metadata } from 'next';
import { getAdminOrdersAction } from '@/app/actions/order.actions';
import { AdminOrderListViewer } from '@/components/admin/orders/AdminOrderListViewer';

export const metadata: Metadata = {
  title: '주문 & 배송 통합 관리 (CMS) | aramdream store Admin',
  description: '주문 상태 단계별 변경, 택배사 및 송장 번호 등록, 배송 라이프사이클 통제',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminOrdersPage() {
  const result = await getAdminOrdersAction({
    limit: 100,
  });

  const orders = result.success && result.data ? result.data.orders : [];
  const totalCount = result.success && result.data ? result.data.totalCount : 0;

  return (
    <AdminOrderListViewer
      initialOrders={orders}
      totalCount={totalCount}
    />
  );
}
