import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAvailablePromotionsAction,
  calculatePromotionDiscountAction,
} from './promotion.actions';

let mockUser: { id: string } | null = { id: 'user-1' };

vi.mock('@/core/infrastructure/supabase/server', () => ({
  getServerClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: mockUser },
      })),
    },
  })),
}));

vi.mock('@/core/infrastructure/repositories/SupabaseCouponRepository', () => {
  return {
    SupabaseCouponRepository: class {
      async findAvailableByCustomerId() {
        const { CustomerCoupon } = await import(
          '@/core/domain/promotion/entities/CustomerCoupon'
        );
        return [
          CustomerCoupon.create(
            {
              customerId: 'user-1',
              name: '5,000원 할인 쿠폰',
              discountAmount: 5000,
              minOrderAmount: 20000,
              expiresAt: new Date(Date.now() + 10000000),
            },
            'coupon-1'
          ).getValue(),
        ];
      }
      async findById(id: string) {
        if (id === 'coupon-1') {
          const { CustomerCoupon } = await import(
            '@/core/domain/promotion/entities/CustomerCoupon'
          );
          return CustomerCoupon.create(
            {
              customerId: 'user-1',
              name: '5,000원 할인 쿠폰',
              discountAmount: 5000,
              minOrderAmount: 20000,
              expiresAt: new Date(Date.now() + 10000000),
            },
            'coupon-1'
          ).getValue();
        }
        return null;
      }
    },
  };
});

vi.mock('@/core/infrastructure/repositories/SupabasePointRepository', () => {
  return {
    SupabasePointRepository: class {
      async getCurrentBalance() {
        return 7000;
      }
    },
  };
});

describe('promotion.actions (Server Actions)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { id: 'user-1' };
  });

  it('getAvailablePromotionsAction: 로그인 회원의 사용 가능 쿠폰과 적립금을 정상 반환한다', async () => {
    const result = await getAvailablePromotionsAction(30000);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.availablePoints).toBe(7000);
    expect(result.data?.coupons).toHaveLength(1);
    expect(result.data?.coupons[0].isUsable).toBe(true);
    expect(result.data?.coupons[0].calculatedDiscount).toBe(5000);
  });

  it('getAvailablePromotionsAction: 비로그인 상태일 때는 빈 프로모션 정보를 반환한다', async () => {
    mockUser = null;
    const result = await getAvailablePromotionsAction(30000);

    expect(result.success).toBe(true);
    expect(result.data?.coupons).toHaveLength(0);
    expect(result.data?.availablePoints).toBe(0);
  });

  it('calculatePromotionDiscountAction: 쿠폰과 적립금 할인을 올바르게 산출한다', async () => {
    const result = await calculatePromotionDiscountAction({
      orderAmount: 40000,
      shippingFee: 3000,
      couponId: 'coupon-1',
      pointsToUse: 2000,
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.productAmount).toBe(40000);
    expect(result.data?.couponDiscount).toBe(5000);
    expect(result.data?.pointsDiscount).toBe(2000);
    expect(result.data?.totalDiscount).toBe(7000);
    // 40,000 - 7,000 + 3,000 = 36,000원
    expect(result.data?.finalPaymentAmount).toBe(36000);
    // (40,000 - 7,000) * 0.01 = 330P
    expect(result.data?.expectedRewardPoints).toBe(330);
  });
});

