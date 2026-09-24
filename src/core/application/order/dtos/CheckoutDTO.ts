import type { PaymentMethod } from '@/shared/types/database.types';
import type { AvailableCouponDTO } from '@/core/application/promotion/dtos/PromotionDTO';

export interface CheckoutItemDTO {
  id: string;
  productId: string;
  variantId?: string | null;
  productName: string;
  variantName?: string | null;
  coverImageUrl?: string | null;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface CheckoutShippingInput {
  recipientName: string;
  recipientPhone: string;
  address: string;
  zipcode: string;
  message?: string;
}

export interface CheckoutDataDTO {
  items: CheckoutItemDTO[];
  productTotal: number;
  shippingFee: number;
  availableCoupons: AvailableCouponDTO[];
  availablePoints: number;
  maxPointsUsable: number;
  defaultShippingAddress?: CheckoutShippingInput;
}

export interface PlaceOrderInput {
  shippingAddress: CheckoutShippingInput;
  paymentMethod: PaymentMethod;
  couponId?: string | null;
  pointsToUse?: number;
}
