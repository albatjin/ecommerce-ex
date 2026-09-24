import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/shared/types/database.types';
import { getSupabaseEnv } from './env';

/**
 * Server Components, Server Actions, Route Handlers에서 사용할 Supabase 클라이언트를 반환합니다.
 * Next.js 15+ 및 16의 비동기 cookies() API 규격을 준수합니다.
 */
export async function getServerClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseEnv();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Component 환경에서는 cookies().set() 호출 시 예외가 발생할 수 있습니다.
          // 미들웨어(middleware.ts)에서 세션 갱신을 주도하므로 안전하게 무시합니다.
        }
      },
    },
  });
}

