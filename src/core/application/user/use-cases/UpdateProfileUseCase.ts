import type { IUserRepository } from '@/core/domain/user/IUserRepository';
import type { User } from '@/core/domain/user/User';
import type { UpdateProfileInputDTO } from '../dto/user.dto';
import { Result, ok, fail } from '@/core/domain/shared/Result';
import { BaseError, NotFoundError, InternalError } from '@/core/domain/shared/AppError';

export class UpdateProfileUseCase {
  constructor(private userRepository: IUserRepository) {}

  public async execute(dto: UpdateProfileInputDTO): Promise<Result<User, BaseError>> {
    try {
      const user = await this.userRepository.findById(dto.userId);
      if (!user) {
        return fail(new NotFoundError('User', dto.userId));
      }

      // 프로필 속성 수정
      user.updateProfile({
        name: dto.name,
        phone: dto.phone,
        personalCustomsCode: dto.personalCustomsCode,
        gender: dto.gender,
        birthYear: dto.birthYear,
        defaultAddress: dto.defaultAddress,
        defaultZipcode: dto.defaultZipcode,
      });

      // 마케팅 동의 수정 (제공된 경우)
      if (
        dto.smsConsent !== undefined ||
        dto.emailConsent !== undefined ||
        dto.appPushConsent !== undefined
      ) {
        user.updateMarketingConsent({
          smsConsent: dto.smsConsent ?? user.smsConsent,
          emailConsent: dto.emailConsent ?? user.emailConsent,
          appPushConsent: dto.appPushConsent ?? user.appPushConsent,
        });
      }

      await this.userRepository.update(user);
      return ok(user);
    } catch (err: unknown) {
      if (err instanceof BaseError) return fail(err);
      const message = err instanceof Error ? err.message : '프로필 수정 실패';
      return fail(new InternalError(message, err));
    }
  }
}

