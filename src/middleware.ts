import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/core/infrastructure/supabase/middleware';
import { determineRouteAccess } from '@/core/application/auth/route-guard';
import type { UserRole } from '@/shared/types/database.types';

export async function middleware(request: NextRequest) {
  // 1. Supabase Auth 세션 갱신 및 사용자 정보 추출
  const { response, user } = await updateSession(request);

  // 2. 사용자 역할(Role) 파악 (auth 메타데이터 기반)
  const userRole = (user?.user_metadata?.role || user?.app_metadata?.role || 'customer') as UserRole;
  const isAuthenticated = Boolean(user);

  // 3. 라우트 가드 규칙 검사
  const { allowed, redirectUrl } = determineRouteAccess({
    pathname: request.nextUrl.pathname,
    searchParams: request.nextUrl.searchParams.toString(),
    isAuthenticated,
    userRole: isAuthenticated ? userRole : null,
  });

  if (!allowed && redirectUrl) {
    const redirectResponse = NextResponse.redirect(new URL(redirectUrl, request.url));
    // 리다이렉트 시에도 세션 갱신된 쿠키들을 전달
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (.svg, .png, .jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

