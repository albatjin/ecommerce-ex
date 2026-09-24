import type { UserRole } from '@/shared/types/database.types';

export interface RouteGuardParams {
  pathname: string;
  searchParams?: string;
  isAuthenticated: boolean;
  userRole?: UserRole | null;
}

export interface RouteGuardResult {
  allowed: boolean;
  redirectUrl?: string;
}

// 비로그인 사용자 접근 차단 (로그인 필수 라우트)
const PROTECTED_PREFIXES = ['/my-page', '/checkout', '/orders'];

// 관리자 권한 필수 라우트
const ADMIN_PREFIX = '/admin';

// 이미 로그인된 사용자 접근 시 홈 리다이렉트 라우트
const AUTH_ONLY_PREFIXES = ['/login', '/signup'];

// 관리자 허용 역할 목록
const ADMIN_ROLES: UserRole[] = ['super_admin', 'admin', 'manager', 'staff'];

/**
 * 주어진 경로(pathname)와 사용자 인증/인가 상태에 따른 라우트 접근 가부 및 리다이렉트 URL 결정
 */
export function determineRouteAccess({
  pathname,
  searchParams = '',
  isAuthenticated,
  userRole,
}: RouteGuardParams): RouteGuardResult {
  const fullPath = searchParams ? `${pathname}?${searchParams}` : pathname;

  // 1. 관리자 라우트 검사 (/admin)
  if (pathname.startsWith(ADMIN_PREFIX)) {
    if (!isAuthenticated) {
      return {
        allowed: false,
        redirectUrl: `/login?redirect=${encodeURIComponent(fullPath)}`,
      };
    }

    if (!userRole || !ADMIN_ROLES.includes(userRole)) {
      return {
        allowed: false,
        redirectUrl: '/?error=forbidden',
      };
    }

    return { allowed: true };
  }

  // 2. 회원 보호 라우트 검사 (/my-page, /checkout, /orders 등)
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (isProtected) {
    if (!isAuthenticated) {
      return {
        allowed: false,
        redirectUrl: `/login?redirect=${encodeURIComponent(fullPath)}`,
      };
    }
    return { allowed: true };
  }

  // 3. 인증 전용 라우트 (/login, /signup)
  const isAuthOnly = AUTH_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (isAuthOnly && isAuthenticated) {
    return {
      allowed: false,
      redirectUrl: '/',
    };
  }

  // 4. 일반 공개 라우트 (누구나 접근 가능)
  return { allowed: true };
}

