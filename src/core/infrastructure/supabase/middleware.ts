import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/shared/types/database.types';
import { getSupabaseEnv } from './env';

/**
 * Next.js Middleware 환경에서 Supabase Auth 세션 토큰을 리프레시하고
 * 요청/응답 쿠키를 동기화하는 헬퍼 함수입니다.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Auth 토큰 검증 및 자동 갱신 (중요: getSession 대신 보안상 안전한 getUser 호출)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user, supabase };
}

