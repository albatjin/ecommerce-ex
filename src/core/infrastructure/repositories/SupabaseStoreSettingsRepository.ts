import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/shared/types/database.types';
import type { IStoreSettingsRepository } from '@/core/domain/settings/IStoreSettingsRepository';
import { StoreSettings } from '@/core/domain/settings/StoreSettings';
import { StoreSettingsMapper } from '@/core/application/settings/mappers/StoreSettingsMapper';
import { getServerClient } from '../supabase/server';
import { InternalError } from '@/core/domain/shared/AppError';

export class SupabaseStoreSettingsRepository implements IStoreSettingsRepository {
  private client?: SupabaseClient<Database>;

  constructor(client?: SupabaseClient<Database>) {
    this.client = client;
  }

  private async getClient(): Promise<SupabaseClient<Database>> {
    if (this.client) {
      return this.client;
    }
    return (await getServerClient()) as unknown as SupabaseClient<Database>;
  }

  public async getSettings(): Promise<StoreSettings> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();

    if (error) {
      throw new InternalError(`스토어 환경설정 조회 실패: ${error.message}`, error);
    }

    if (!data) {
      // 행이 존재하지 않는 경우 기본 설정 엔티티를 반환하고 백그라운드에서 기본 행 생성
      const defaultEntity = StoreSettings.createDefault();
      try {
        const persistenceData = StoreSettingsMapper.toPersistence(defaultEntity);
        await supabase.from('store_settings').insert(persistenceData);
      } catch {
        // 이미 다른 프로세스에서 생성했을 수 있으므로 에러 무시
      }
      return defaultEntity;
    }

    return StoreSettingsMapper.toDomain(data);
  }

  public async saveSettings(settings: StoreSettings, updatedBy?: string): Promise<void> {
    const supabase = await this.getClient();
    const persistenceData = StoreSettingsMapper.toPersistence(settings, updatedBy);

    const { error } = await supabase
      .from('store_settings')
      .upsert(persistenceData, { onConflict: 'id' });

    if (error) {
      throw new InternalError(`스토어 환경설정 저장 실패: ${error.message}`, error);
    }
  }
}
