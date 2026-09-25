import { describe, it, expect, vi } from 'vitest';
import { UpdateStoreSettingsUseCase } from './UpdateStoreSettingsUseCase';
import type { IStoreSettingsRepository } from '@/core/domain/settings/IStoreSettingsRepository';
import type { UpdateStoreSettingsDTO } from '../dtos/StoreSettingsDTO';

describe('UpdateStoreSettingsUseCase', () => {
  const validDTO: UpdateStoreSettingsDTO = {
    storeName: '새로운 공식스토어',
    representativeName: '이관리',
    businessNumber: '123-45-67890',
    ecommercePermitNumber: '2026-서울강남-1234호',
    csPhone: '1544-0000',
    csEmail: 'help@newstore.com',
    address: '서울시 강남구 테헤란로 1',
    zipcode: '06234',
    logoHeaderUrl: null,
    logoMobileUrl: null,
    faviconUrl: null,
    isOperating: true,
    requireAdultVerification: false,
    allowGuestOrder: true,
    defaultShippingFee: 3500,
    freeShippingThreshold: 60000,
    islandMountainShippingFee: 4000,
    purchaseRewardRate: 2.0,
    textReviewReward: 700,
    photoReviewReward: 1800,
    welcomeReward: 5000,
  };

  it('유효한 데이터로 환경설정을 성공적으로 업데이트하고 저장한다', async () => {
    const saveSpy = vi.fn().mockResolvedValue(undefined);
    const mockRepo: IStoreSettingsRepository = {
      getSettings: vi.fn(),
      saveSettings: saveSpy,
    };

    const useCase = new UpdateStoreSettingsUseCase(mockRepo);
    const result = await useCase.execute(validDTO, 'admin-user-id');

    expect(result.isSuccess).toBe(true);
    expect(saveSpy).toHaveBeenCalledTimes(1);
    const dto = result.getValue();
    expect(dto.storeName).toBe('새로운 공식스토어');
    expect(dto.defaultShippingFee).toBe(3500);
    expect(dto.freeShippingThreshold).toBe(60000);
    expect(dto.updatedBy).toBe('admin-user-id');
  });

  it('유효하지 않은 데이터(음수 배송비 등)는 ValidationError를 반환한다', async () => {
    const mockRepo: IStoreSettingsRepository = {
      getSettings: vi.fn(),
      saveSettings: vi.fn(),
    };

    const useCase = new UpdateStoreSettingsUseCase(mockRepo);
    const result = await useCase.execute({
      ...validDTO,
      defaultShippingFee: -500,
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError().message).toContain('기본 배송비');
  });
});
