import { Result, ok, fail } from '@/core/domain/shared/Result';
import { BaseError, InternalError } from '@/core/domain/shared/AppError';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/shared/types/database.types';
import { getServerClient } from '@/core/infrastructure/supabase/server';

export class SignOutUseCase {
  constructor(private supabaseClient?: SupabaseClient<Database>) {}

  private async getClient(): Promise<SupabaseClient<Database>> {
    if (this.supabaseClient) {
      return this.supabaseClient;
    }
    return (await getServerClient()) as unknown as SupabaseClient<Database>;
  }

  public async execute(): Promise<Result<void, BaseError>> {
    try {
      const supabase = await this.getClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        return fail(new InternalError(`로그아웃 처리 실패: ${error.message}`, error));
      }

      return ok();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '로그아웃 실패';
      return fail(new InternalError(message, err));
    }
  }
}

