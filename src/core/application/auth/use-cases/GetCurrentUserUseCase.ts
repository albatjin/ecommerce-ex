import type { IUserRepository } from '@/core/domain/user/IUserRepository';
import type { User } from '@/core/domain/user/User';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/shared/types/database.types';
import { getServerClient } from '@/core/infrastructure/supabase/server';

export class GetCurrentUserUseCase {
  constructor(
    private userRepository: IUserRepository,
    private supabaseClient?: SupabaseClient<Database>
  ) {}

  private async getClient(): Promise<SupabaseClient<Database>> {
    if (this.supabaseClient) {
      return this.supabaseClient;
    }
    return (await getServerClient()) as unknown as SupabaseClient<Database>;
  }

  public async execute(): Promise<User | null> {
    try {
      const supabase = await this.getClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) return null;

      return await this.userRepository.findById(authUser.id);
    } catch {
      return null;
    }
  }
}

