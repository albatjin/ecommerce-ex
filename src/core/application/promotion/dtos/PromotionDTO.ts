export interface AvailableCouponDTO {
  id: string;
  name: string;
  discountAmount?: number | null;
  discountRate?: number | null;
  minOrderAmount: number;
  calculatedDiscount: number;
  isUsable: boolean;
  unusableReason?: string;
  expiresAt: string;
}

export interface AvailablePromotionsDTO {
  coupons: AvailableCouponDTO[];
  availablePoints: number;
  maxPointsUsable: number;
}

export interface CalculatePromotionInput {
  orderAmount: number;
  shippingFee: number;
  couponId?: string | null;
  pointsToUse?: number;
}

export interface PromotionCalculationResultDTO {
  productAmount: number;
  shippingFee: number;
  couponDiscount: number;
  pointsDiscount: number;
  totalDiscount: number;
  finalPaymentAmount: number;
  expectedRewardPoints: number;
  appliedCoupon?: {
    id: string;
    name: string;
    discountAmount: number;
  } | null;
}

