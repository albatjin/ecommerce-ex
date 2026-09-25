import type { Metadata } from 'next';
import { SupabaseUserRepository } from '@/core/infrastructure/repositories/SupabaseUserRepository';
import { GetCurrentUserUseCase } from '@/core/application/auth';
import { AdminShell } from '@/components/admin/AdminShell';

export const metadata: Metadata = {
  title: {
    template: '%s | CommerceHub Admin',
    default: '관리자 콘솔 | CommerceHub',
  },
  description: 'CommerceHub 쇼핑몰 통합 관리자 플랫폼',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userRepository = new SupabaseUserRepository();
  const getCurrentUserUseCase = new GetCurrentUserUseCase(userRepository);
  const user = await getCurrentUserUseCase.execute();

  const supabase = await (await import('@/core/infrastructure/supabase/server')).getServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const { checkIsAdmin } = await import('@/shared/utils/admin');
  const isCurrentAdmin = checkIsAdmin({
    role: user?.role,
    email: user?.email || authUser?.email,
  });

  const adminRoleDisplay = (
    user && ['super_admin', 'admin', 'manager', 'staff'].includes(user.role.toLowerCase())
      ? user.role.toUpperCase()
      : 'ADMIN'
  );

  const adminUser = user
    ? {
        name: user.name,
        email: user.email,
        role: adminRoleDisplay,
      }
    : {
        name: authUser?.user_metadata?.name || authUser?.email?.split('@')[0] || '시스템 관리자',
        email: authUser?.email || 'admin@commercehub.internal',
        role: 'ADMIN',
      };

  return <AdminShell adminUser={adminUser}>{children}</AdminShell>;
}

