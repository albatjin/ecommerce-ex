import type { Metadata } from 'next';
import { getAdminUsersAction } from '@/app/actions/user-admin.actions';
import { AdminUserListViewer } from '@/components/admin/users/AdminUserListViewer';

export const metadata: Metadata = {
  title: '회원 통합 관리 (CMS) | aramdream store Admin',
  description: '회원 목록 조회, 등급 및 상태 변경, 적립금과 쿠폰 수동 지급 관리',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminUsersPage() {
  const result = await getAdminUsersAction({
    limit: 100,
  });

  const users = result.success && result.data ? result.data.users : [];
  const totalCount = result.success && result.data ? result.data.totalCount : 0;

  return (
    <AdminUserListViewer
      initialUsers={users}
      totalCount={totalCount}
    />
  );
}
