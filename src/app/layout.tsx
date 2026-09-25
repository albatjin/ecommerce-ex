import type { Metadata } from 'next';
import './globals.css';
import { Header, Footer } from '@/components/common';
import { CartProvider, CartDrawer } from '@/components/cart';
import { getServerClient } from '@/core/infrastructure/supabase/server';
import { getCategoryTreeAction } from '@/app/actions/catalog.actions';
import { getCartAction } from '@/app/actions/cart.actions';
import type { UserRole } from '@/shared/types/database.types';
import type { CategoryTreeNode } from '@/core/application/catalog/dtos/CategoryTreeDTO';
import type { CartDTO } from '@/core/application/cart/dtos/CartDTO';

export const metadata: Metadata = {
  title: 'CommerceHub | 프리미엄 이커머스 셀렉트숍',
  description: 'Next.js 16 + React 19 + Supabase SSR 기반의 엔터프라이즈급 이커머스 플랫폼',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let userName: string | null = null;
  let isAdmin = false;
  let categories: CategoryTreeNode[] = [];
  let initialCart: CartDTO | null = null;

  try {
    const supabase = await getServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      userName = user.user_metadata?.name || user.email?.split('@')[0] || null;
      let role = (user.user_metadata?.role || user.app_metadata?.role) as UserRole | undefined;

      // 1. Supabase users 테이블에서 실제 role 조회 (user_metadata에 role이 없을 경우 대비)
      if (!role) {
        try {
          const { data: dbUser } = await supabase
            .from('users')
            .select('name, role')
            .eq('id', user.id)
            .maybeSingle();

          if (dbUser) {
            role = dbUser.role as UserRole;
            if (dbUser.name) userName = dbUser.name;
          }
        } catch {
          // 조회 실패 시 안전하게 기본값 유지
        }
      }

      // 2. 이메일 기반 관리자 폴백 검사 (admin@ 또는 아이디에 admin 포함된 경우)
      const email = user.email?.toLowerCase() || '';
      const isEmailAdmin = email.startsWith('admin@') || email.includes('admin');

      isAdmin = ['super_admin', 'admin', 'manager', 'staff'].includes(role || 'customer') || isEmailAdmin;
    }

    const [categoryResult, cartResult] = await Promise.all([
      getCategoryTreeAction(),
      getCartAction(),
    ]);

    if (categoryResult.success && categoryResult.data) {
      categories = categoryResult.data;
    }
    if (cartResult.success && cartResult.data) {
      initialCart = cartResult.data;
    }
  } catch {
    // SSR 초기 렌더링 중 오류 발생 시 안전하게 기본값으로 폴백
  }

  return (
    <html lang="ko">
      <body className="antialiased flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <CartProvider initialCart={initialCart}>
          <Header
            userName={userName}
            isAdmin={isAdmin}
            categories={categories}
            cartItemCount={initialCart?.totalItemCount ?? 0}
          />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
