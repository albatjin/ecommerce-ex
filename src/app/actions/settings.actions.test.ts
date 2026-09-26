import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getStoreSettingsAction,
  updateStoreSettingsAction,
} from './settings.actions';
import { StoreSettings } from '@/core/domain/settings/StoreSettings';
import { StoreSettingsMapper } from '@/core/application/settings/mappers/StoreSettingsMapper';

// Mocks
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

const mockDefaultSettings = StoreSettings.createDefault();
const mockSettingsDTO = StoreSettingsMapper.toDTO(mockDefaultSettings);

const mockGetSettings = vi.fn().mockResolvedValue(mockDefaultSettings);
const mockSaveSettings = vi.fn().mockResolvedValue(undefined);

vi.mock('@/core/infrastructure/repositories/SupabaseStoreSettingsRepository', () => {
  return {
    SupabaseStoreSettingsRepository: class {
      getSettings() {
        return mockGetSettings();
      }
      saveSettings(settings: any, updatedBy?: string) {
        return mockSaveSettings(settings, updatedBy);
      }
    },
  };
});

const mockGetUser = vi.fn().mockResolvedValue({
  data: {
    user: {
      id: 'admin-1',
      email: 'albat77@nate.com',
      user_metadata: { role: 'admin' },
    },
  },
});

vi.mock('@/core/infrastructure/supabase/server', () => ({
  getServerClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: () => mockGetUser(),
    },
  }),
}));

describe('Settings Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSettings.mockResolvedValue(mockDefaultSettings);
    mockSaveSettings.mockResolvedValue(undefined);
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'admin-1',
          email: 'albat77@nate.com',
          user_metadata: { role: 'admin' },
        },
      },
    });
  });

  describe('getStoreSettingsAction', () => {
    it('환경설정 정보를 성공적으로 조회하여 반환한다', async () => {
      const result = await getStoreSettingsAction();
      expect(result.success).toBe(true);
      expect(result.data?.storeName).toBe('aramdream store');
      expect(result.data?.defaultShippingFee).toBe(3000);
    });
  });

  describe('updateStoreSettingsAction', () => {
    it('관리자 권한을 가진 사용자가 환경설정을 성공적으로 업데이트한다', async () => {
      const updateDTO = {
        ...mockSettingsDTO,
        storeName: '수정된 커머스허브',
        defaultShippingFee: 3500,
      };

      const result = await updateStoreSettingsAction(updateDTO);
      expect(result.success).toBe(true);
      expect(result.data?.storeName).toBe('수정된 커머스허브');
      expect(result.data?.defaultShippingFee).toBe(3500);
    });

    it('관리자 권한이 없는 일반 고객인 경우 업데이트를 거부한다', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: {
          user: {
            id: 'cust-1',
            email: 'customer@daum.net',
            user_metadata: { role: 'customer' },
          },
        },
      });

      const updateDTO = {
        ...mockSettingsDTO,
        storeName: '해킹 시도',
      };

      const result = await updateStoreSettingsAction(updateDTO);
      expect(result.success).toBe(false);
      expect(result.error).toContain('관리자 권한');
    });
  });
});
