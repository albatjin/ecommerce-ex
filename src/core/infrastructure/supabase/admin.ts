import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/shared/types/database.types';
import { getSupabaseEnv } from './env';

let adminClient: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Service Role Key를 사용하는 Supabase Admin 클라이언트를 반환합니다.
 * 백엔드 관리 작업 및 RLS를 우회해야 하는 서버 환경에서만 제한적으로 사용합니다.
 */
export function getAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error('getAdminClient cannot be called in the browser environment.');
  }

  const { url, serviceRoleKey } = getSupabaseEnv();

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required to initialize Admin client.');
  }

  if (!adminClient) {
    adminClient = createClient<Database>(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminClient;
}

