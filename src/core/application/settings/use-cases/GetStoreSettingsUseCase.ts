import type { IStoreSettingsRepository } from '@/core/domain/settings/IStoreSettingsRepository';
import { StoreSettingsMapper } from '../mappers/StoreSettingsMapper';
import type { StoreSettingsDTO } from '../dtos/StoreSettingsDTO';
import { Result, ok, fail } from '@/core/domain/shared/Result';
import { BaseError, InternalError } from '@/core/domain/shared/AppError';

export class GetStoreSettingsUseCase {
  constructor(private settingsRepository: IStoreSettingsRepository) {}

  public async execute(): Promise<Result<StoreSettingsDTO, BaseError>> {
    try {
      const settings = await this.settingsRepository.getSettings();
      return ok(StoreSettingsMapper.toDTO(settings));
    } catch (error) {
      return fail(
        new InternalError(
          error instanceof Error
            ? error.message
            : '환경설정 정보를 불러오는데 실패했습니다.',
          error
        )
      );
    }
  }
}
