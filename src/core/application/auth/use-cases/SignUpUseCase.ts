import type { IUserRepository } from '@/core/domain/user/IUserRepository';
import type { User } from '@/core/domain/user/User';
import type { SignUpDTO } from '../dto/auth.dto';
import { Result, ok, fail } from '@/core/domain/shared/Result';
import {
  BaseError,
  ConflictError,
  ValidationError,
  InternalError,
} from '@/core/domain/shared/AppError';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/shared/types/database.types';
import { getServerClient } from '@/core/infrastructure/supabase/server';

export class SignUpUseCase {
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

  public async execute(dto: SignUpDTO): Promise<Result<User, BaseError>> {
    // 1. 유효성 기본 검증
    if (!dto.email || !dto.email.includes('@')) {
      return fail(new ValidationError('유효한 이메일 주소를 입력해 주세요.'));
    }
    if (!dto.password || dto.password.length < 6) {
      return fail(new ValidationError('비밀번호는 최소 6자 이상이어야 합니다.'));
    }
    if (!dto.name || dto.name.trim().length === 0) {
      return fail(new ValidationError('이름을 입력해 주세요.'));
    }

    try {
      // 2. 이메일 중복 체크
      const existingUser = await this.userRepository.findByEmail(dto.email.trim());
      if (existingUser) {
        return fail(new ConflictError('이미 가입된 이메일 주소입니다.'));
      }

      // 3. Supabase Auth 계정 생성
      const supabase = await this.getClient();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: dto.email.trim(),
        password: dto.password,
        options: {
          data: {
            name: dto.name.trim(),
            phone: dto.phone ?? null,
            role: 'customer',
          },
        },
      });

      if (authError) {
        return fail(new InternalError(`회원가입 처리 실패: ${authError.message}`, authError));
      }

      if (!authData.user) {
        return fail(new InternalError('인증 사용자를 생성할 수 없습니다.'));
      }

      // 4. 생성된 회원 정보 조회 (DB 트리거 handle_new_user에 의해 public.users에 생성됨)
      // 만약 트리거 지연이 있을 경우 생성 대기 및 마케팅 동의 갱신
      let user = await this.userRepository.findById(authData.user.id);

      if (user) {
        if (dto.smsConsent || dto.emailConsent) {
          user.updateMarketingConsent({
            smsConsent: dto.smsConsent ?? false,
            emailConsent: dto.emailConsent ?? false,
            appPushConsent: false,
          });
          await this.userRepository.update(user);
        }
      } else {
        // 폴백: 트리거가 실행되지 않았거나 즉시 조회가 안될 경우 도메인 엔티티를 직접 저장
        const generatedCustNum = `CUST-${Math.floor(Math.random() * 90000 + 10000)}`;
        const newUserResult = (await import('@/core/domain/user/User')).User.create(
          {
            customerNumber: generatedCustNum,
            email: dto.email.trim(),
            name: dto.name.trim(),
            phone: dto.phone ?? null,
            role: 'customer',
            rewardPoints: 3000, // 신규 가입 웰컴 적립금
            couponsCount: 0,
            smsConsent: dto.smsConsent ?? false,
            emailConsent: dto.emailConsent ?? false,
            appPushConsent: false,
          },
          authData.user.id
        );

        if (newUserResult.isSuccess) {
          user = newUserResult.getValue();
          await this.userRepository.save(user);
        }
      }

      if (!user) {
        return fail(new InternalError('회원 프로필 동기화에 실패했습니다.'));
      }

      return ok(user);
    } catch (err: unknown) {
      if (err instanceof BaseError) return fail(err);
      const message = err instanceof Error ? err.message : '알 수 없는 오류';
      return fail(new InternalError(message, err));
    }
  }
}

