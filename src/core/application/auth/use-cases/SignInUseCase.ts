import type { IUserRepository } from '@/core/domain/user/IUserRepository';
import type { User } from '@/core/domain/user/User';
import type { SignInDTO } from '../dto/auth.dto';
import { Result, ok, fail } from '@/core/domain/shared/Result';
import {
  BaseError,
  ValidationError,
  UnauthorizedError,
  InternalError,
} from '@/core/domain/shared/AppError';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/shared/types/database.types';
import { getServerClient } from '@/core/infrastructure/supabase/server';
import { isEmailAdmin } from '@/shared/utils/admin';

export class SignInUseCase {
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

  public async execute(dto: SignInDTO): Promise<Result<User, BaseError>> {
    if (!dto.email || !dto.email.includes('@')) {
      return fail(new ValidationError('유효한 이메일 주소를 입력해 주세요.'));
    }
    if (!dto.password) {
      return fail(new ValidationError('비밀번호를 입력해 주세요.'));
    }

    try {
      const supabase = await this.getClient();
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: dto.email.trim(),
        password: dto.password,
      });

      if (authError || !authData.user) {
        return fail(new UnauthorizedError('이메일 또는 비밀번호가 올바르지 않습니다.'));
      }

      // 프로필 엔티티 조회
      const user = await this.userRepository.findById(authData.user.id);
      if (!user) {
        return fail(new UnauthorizedError('회원 프로필 정보를 찾을 수 없습니다.'));
      }

      // 회원 상태 확인
      if (user.status === 'WITHDRAWN') {
        // 이미 탈퇴한 계정인 경우 세션 즉시 만료 처리
        await supabase.auth.signOut();
        return fail(new UnauthorizedError('탈퇴 처리된 계정입니다. 고객센터에 문의해 주세요.'));
      }

      // 지정된 관리자 이메일 계정인 경우 DB 역할 자동 동기화
      if (isEmailAdmin(dto.email) && user.role === 'customer') {
        try {
          await supabase.from('users').update({ role: 'admin' }).eq('id', user.id);
        } catch {
          // 비동기 갱신 실패 무시
        }
      }

      return ok(user);
    } catch (err: unknown) {
      if (err instanceof BaseError) return fail(err);
      const message = err instanceof Error ? err.message : '로그인 처리 중 오류 발생';
      return fail(new InternalError(message, err));
    }
  }
}

