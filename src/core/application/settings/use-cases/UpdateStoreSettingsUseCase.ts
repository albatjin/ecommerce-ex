import type { IStoreSettingsRepository } from '@/core/domain/settings/IStoreSettingsRepository';
import { StoreSettings } from '@/core/domain/settings/StoreSettings';
import { StoreSettingsMapper } from '../mappers/StoreSettingsMapper';
import type { StoreSettingsDTO, UpdateStoreSettingsDTO } from '../dtos/StoreSettingsDTO';
import { Result, ok, fail } from '@/core/domain/shared/Result';
import { BaseError, ValidationError, InternalError } from '@/core/domain/shared/AppError';

export class UpdateStoreSettingsUseCase {
  constructor(private settingsRepository: IStoreSettingsRepository) {}

  public async execute(
    dto: UpdateStoreSettingsDTO,
    updatedBy?: string
  ): Promise<Result<StoreSettingsDTO, BaseError>> {
    try {
      const entityResult = StoreSettings.create(
        {
          storeName: dto.storeName,
          representativeName: dto.representativeName,
          businessNumber: dto.businessNumber,
          ecommercePermitNumber: dto.ecommercePermitNumber,
          csPhone: dto.csPhone,
          csEmail: dto.csEmail,
          address: dto.address,
          zipcode: dto.zipcode,
          logoHeaderUrl: dto.logoHeaderUrl,
          logoMobileUrl: dto.logoMobileUrl,
          faviconUrl: dto.faviconUrl,
          isOperating: dto.isOperating,
          requireAdultVerification: dto.requireAdultVerification,
          allowGuestOrder: dto.allowGuestOrder,
          defaultShippingFee: dto.defaultShippingFee,
          freeShippingThreshold: dto.freeShippingThreshold,
          islandMountainShippingFee: dto.islandMountainShippingFee,
          purchaseRewardRate: dto.purchaseRewardRate,
          textReviewReward: dto.textReviewReward,
          photoReviewReward: dto.photoReviewReward,
          welcomeReward: dto.welcomeReward,
          updatedAt: new Date(),
          updatedBy: updatedBy ?? null,
        },
        'default'
      );

      if (entityResult.isFailure) {
        return fail(entityResult.getError());
      }

      const entity = entityResult.getValue();
      await this.settingsRepository.saveSettings(entity, updatedBy);

      return ok(StoreSettingsMapper.toDTO(entity));
    } catch (error) {
      if (error instanceof BaseError) {
        return fail(error);
      }
      return fail(
        new InternalError(
          error instanceof Error
            ? error.message
            : '환경설정 정보를 저장하는데 실패했습니다.',
          error
        )
      );
    }
  }
}
