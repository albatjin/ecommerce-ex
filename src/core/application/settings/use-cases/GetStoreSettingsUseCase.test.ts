import { describe, it, expect, vi } from 'vitest';
import { GetStoreSettingsUseCase } from './GetStoreSettingsUseCase';
import { StoreSettings } from '@/core/domain/settings/StoreSettings';
import type { IStoreSettingsRepository } from '@/core/domain/settings/IStoreSettingsRepository';

describe('GetStoreSettingsUseCase', () => {
  it('환경설정 정보를 성공적으로 조회하여 DTO로 반환한다', async () => {
    const defaultSettings = StoreSettings.createDefault();
    const mockRepo: IStoreSettingsRepository = {
      getSettings: vi.fn().mockResolvedValue(defaultSettings),
      saveSettings: vi.fn().mockResolvedValue(undefined),
    };

    const useCase = new GetStoreSettingsUseCase(mockRepo);
    const result = await useCase.execute();

    expect(result.isSuccess).toBe(true);
    const dto = result.getValue();
    expect(dto.storeName).toBe('aramdream store');
    expect(dto.defaultShippingFee).toBe(3000);
    expect(dto.freeShippingThreshold).toBe(50000);
    expect(dto.isOperating).toBe(true);
  });

  it('리포지토리 에러 발생 시 fail(InternalError)을 반환한다', async () => {
    const mockRepo: IStoreSettingsRepository = {
      getSettings: vi.fn().mockRejectedValue(new Error('DB Connection Failed')),
      saveSettings: vi.fn(),
    };

    const useCase = new GetStoreSettingsUseCase(mockRepo);
    const result = await useCase.execute();

    expect(result.isFailure).toBe(true);
    expect(result.getError().message).toContain('DB Connection Failed');
  });
});
