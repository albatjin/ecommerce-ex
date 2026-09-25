import { describe, it, expect, vi } from 'vitest';
import { SupabaseStoreSettingsRepository } from './SupabaseStoreSettingsRepository';
import { StoreSettings } from '@/core/domain/settings/StoreSettings';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/shared/types/database.types';

describe('SupabaseStoreSettingsRepository', () => {
  it('DB에 설정 데이터가 존재하면 toDomain으로 매핑하여 반환한다', async () => {
    const mockRow = {
      id: 'default',
      store_name: '테스트 스토어',
      representative_name: '홍길동',
      business_number: '123-45-67890',
      ecommerce_permit_number: '2026-서울-0001',
      cs_phone: '1588-0000',
      cs_email: 'test@store.com',
      address: '서울시 서초구',
      zipcode: '06500',
      logo_header_url: null,
      logo_mobile_url: null,
      favicon_url: null,
      is_operating: true,
      require_adult_verification: false,
      allow_guest_order: true,
      default_shipping_fee: 3000,
      free_shipping_threshold: 50000,
      island_mountain_shipping_fee: 3000,
      purchase_reward_rate: 1.5,
      text_review_reward: 500,
      photo_review_reward: 1500,
      welcome_reward: 3000,
      updated_at: '2026-09-25T00:00:00.000Z',
      updated_by: null,
    };

    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: mockRow, error: null }),
      }),
    });

    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: mockSelect,
      }),
    } as unknown as SupabaseClient<Database>;

    const repo = new SupabaseStoreSettingsRepository(mockClient);
    const settings = await repo.getSettings();

    expect(settings.storeName).toBe('테스트 스토어');
    expect(settings.representativeName).toBe('홍길동');
    expect(settings.defaultShippingFee).toBe(3000);
  });

  it('DB에 행이 없을 경우 기본 설정 엔티티를 반환한다', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    });

    const mockInsert = vi.fn().mockResolvedValue({ error: null });

    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: mockSelect,
        insert: mockInsert,
      }),
    } as unknown as SupabaseClient<Database>;

    const repo = new SupabaseStoreSettingsRepository(mockClient);
    const settings = await repo.getSettings();

    expect(settings.storeName).toBe('CommerceHub 공식스토어');
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });

  it('saveSettings 호출 시 upsert가 실행된다', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });

    const mockClient = {
      from: vi.fn().mockReturnValue({
        upsert: mockUpsert,
      }),
    } as unknown as SupabaseClient<Database>;

    const repo = new SupabaseStoreSettingsRepository(mockClient);
    const settings = StoreSettings.createDefault();
    await repo.saveSettings(settings, 'admin-id');

    expect(mockUpsert).toHaveBeenCalledTimes(1);
  });
});
