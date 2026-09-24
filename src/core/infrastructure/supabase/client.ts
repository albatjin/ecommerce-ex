import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/shared/types/database.types';
import { getSupabaseEnv } from './env';

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * 브라우저(Client Components) 환경에서 사용할 Supabase 클라이언트를 반환합니다.
 * 싱글톤 인스턴스로 관리되어 불필요한 중복 생성을 방지합니다.
 */
export function getBrowserClient() {
  if (typeof window === 'undefined') {
    throw new Error('getBrowserClient can only be called in the browser environment.');
  }

  if (!browserClient) {
    const { url, anonKey } = getSupabaseEnv();
    browserClient = createBrowserClient<Database>(url, anonKey);
  }

  return browserClient;
}

