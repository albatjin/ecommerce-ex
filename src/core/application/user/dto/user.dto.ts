import type { Gender } from '@/shared/types/database.types';

export interface UpdateProfileInputDTO {
  userId: string;
  name?: string;
  phone?: string | null;
  personalCustomsCode?: string | null;
  gender?: Gender | null;
  birthYear?: number | null;
  defaultAddress?: string | null;
  defaultZipcode?: string | null;
  smsConsent?: boolean;
  emailConsent?: boolean;
  appPushConsent?: boolean;
}

