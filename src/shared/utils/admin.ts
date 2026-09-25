import type { UserRole } from '@/shared/types/database.types';

export const ADMIN_ROLES: readonly UserRole[] = [
  'super_admin',
  'admin',
  'manager',
  'staff',
];

/**
 * 기본 등록 관리자 이메일 목록
 */
export const KNOWN_ADMIN_EMAILS: readonly string[] = [
  'albat77@nate.com',
  'admin@commercehub.internal',
  'admin@example.com',
];

/**
 * 이메일 주소를 분석하여 관리자 권한 대상인지 판별합니다.
 * - 지정된 관리자 이메일 목록(KNOWN_ADMIN_EMAILS) 포함 여부
 * - 환경변수 ADMIN_EMAILS에 등록된 이메일 포함 여부
 * - albat 계열 이메일 (albat...)
 * - admin 계열 이메일 (admin@..., ...admin...)
 */
export function isEmailAdmin(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();

  // 1. 등록된 관리자 이메일 직접 매칭 (albat77@nate.com 등)
  if (KNOWN_ADMIN_EMAILS.some((item) => item.toLowerCase() === normalized)) {
    return true;
  }

  // 2. 환경변수 ADMIN_EMAILS 설정 확인
  const envAdminEmails = process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || '';
  if (envAdminEmails) {
    const list = envAdminEmails.split(',').map((e) => e.trim().toLowerCase());
    if (list.includes(normalized)) return true;
  }

  // 3. albat 계열 및 admin 패턴 매칭
  if (
    normalized.startsWith('admin@') ||
    normalized.includes('admin') ||
    normalized.startsWith('albat')
  ) {
    return true;
  }

  return false;
}

/**
 * 역할(role) 및 이메일을 종합적으로 검사하여 관리자 권한 여부를 반환합니다.
 */
export function checkIsAdmin(params: {
  role?: string | null;
  email?: string | null;
}): boolean {
  const { role, email } = params;

  if (role && ADMIN_ROLES.includes(role.toLowerCase() as UserRole)) {
    return true;
  }

  if (isEmailAdmin(email)) {
    return true;
  }

  return false;
}
