import { Metadata } from 'next';
import { getAdminOrdersAction } from '@/app/actions/order.actions';
import { AdminClaimsViewer } from '@/components/admin/AdminClaimsViewer';

export const metadata: Metadata = {
  title: '클레임 및 반품 관리 | 관리자 콘솔',
  description: '주문 취소 및 반품 요청 검수 및 PG 환불 집행',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminClaimsPage() {
  const result = await getAdminOrdersAction({
    filterType: 'CLAIMS_ALL',
    limit: 50,
  });

  const orders = result.data?.orders || [];
  const totalCount = result.data?.totalCount || orders.length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <AdminClaimsViewer initialOrders={orders} totalCount={totalCount} />
    </div>
  );
}

