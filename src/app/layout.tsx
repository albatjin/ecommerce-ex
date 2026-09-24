import type { Metadata } from 'next';
import './globals.css';
import { Header, Footer } from '@/components/common';
import { getServerClient } from '@/core/infrastructure/supabase/server';
import type { UserRole } from '@/shared/types/database.types';

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

  try {
    const supabase = await getServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      userName = user.user_metadata?.name || user.email?.split('@')[0] || null;
      const role = (user.user_metadata?.role || user.app_metadata?.role || 'customer') as UserRole;
      isAdmin = ['super_admin', 'admin', 'manager', 'staff'].includes(role);
    }
  } catch {
    // SSR 초기 렌더링 중 오류 발생 시 게스트 모드로 안전하게 폴백
  }

  return (
    <html lang="ko">
      <body className="antialiased flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <Header userName={userName} isAdmin={isAdmin} cartItemCount={0} />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
