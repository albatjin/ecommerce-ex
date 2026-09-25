import type { StoreSettings } from './StoreSettings';

export interface IStoreSettingsRepository {
  getSettings(): Promise<StoreSettings>;
  saveSettings(settings: StoreSettings, updatedBy?: string): Promise<void>;
}
