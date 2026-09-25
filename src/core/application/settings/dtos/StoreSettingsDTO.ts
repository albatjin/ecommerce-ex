export interface StoreSettingsDTO {
  id: string;
  storeName: string;
  representativeName: string;
  businessNumber: string;
  ecommercePermitNumber: string;
  csPhone: string;
  csEmail: string;
  address: string;
  zipcode: string;
  logoHeaderUrl?: string | null;
  logoMobileUrl?: string | null;
  faviconUrl?: string | null;
  isOperating: boolean;
  requireAdultVerification: boolean;
  allowGuestOrder: boolean;
  defaultShippingFee: number;
  freeShippingThreshold: number;
  islandMountainShippingFee: number;
  purchaseRewardRate: number;
  textReviewReward: number;
  photoReviewReward: number;
  welcomeReward: number;
  updatedAt: string;
  updatedBy?: string | null;
}

export interface UpdateStoreSettingsDTO {
  storeName: string;
  representativeName: string;
  businessNumber: string;
  ecommercePermitNumber: string;
  csPhone: string;
  csEmail: string;
  address: string;
  zipcode: string;
  logoHeaderUrl?: string | null;
  logoMobileUrl?: string | null;
  faviconUrl?: string | null;
  isOperating: boolean;
  requireAdultVerification: boolean;
  allowGuestOrder: boolean;
  defaultShippingFee: number;
  freeShippingThreshold: number;
  islandMountainShippingFee: number;
  purchaseRewardRate: number;
  textReviewReward: number;
  photoReviewReward: number;
  welcomeReward: number;
}
