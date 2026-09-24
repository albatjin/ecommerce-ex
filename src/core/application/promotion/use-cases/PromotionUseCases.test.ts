import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CustomerCoupon } from '../../../domain/promotion/entities/CustomerCoupon';
import type { ICouponRepository } from '../../../domain/promotion/repositories/ICouponRepository';
import type { IPointRepository } from '../../../domain/promotion/repositories/IPointRepository';
import { GetAvailablePromotionsUseCase } from './GetAvailablePromotionsUseCase';
import { CalculatePromotionDiscountUseCase } from './CalculatePromotionDiscountUseCase';

describe('Promotion Use Cases', () => {
  const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24);

  const sampleCoupons = [
    CustomerCoupon.create(
      {
        customerId: 'user-1',
        name: '5,000원 정액 쿠폰',
        discountAmount: 5000,
        minOrderAmount: 30000,
        expiresAt: futureDate,
      },
      'coupon-1'
    ).getValue(),
    CustomerCoupon.create(
      {
        customerId: 'user-1',
        name: '10% 정률 쿠폰',
        discountRate: 10,
        minOrderAmount: 50000,
        expiresAt: futureDate,
      },
      'coupon-2'
    ).getValue(),
    CustomerCoupon.create(
      {
        customerId: 'user-1',
        name: '만료된 쿠폰',
        discountAmount: 3000,
        minOrderAmount: 10000,
        expiresAt: pastDate,
      },
      'coupon-3'
    ).getValue(),
  ];

  let mockCouponRepo: ICouponRepository;
  let mockPointRepo: IPointRepository;
  let getAvailablePromotionsUseCase: GetAvailablePromotionsUseCase;
  let calculatePromotionDiscountUseCase: CalculatePromotionDiscountUseCase;

  beforeEach(() => {
    mockCouponRepo = {
      findAvailableByCustomerId: vi.fn().mockResolvedValue(sampleCoupons),
      findAllByCustomerId: vi.fn().mockResolvedValue(sampleCoupons),
      findById: vi.fn((id: string) => {
        const found = sampleCoupons.find((c) => c.id === id);
        return Promise.resolve(found || null);
      }),
      save: vi.fn().mockResolvedValue(undefined),
      issueCoupon: vi.fn().mockResolvedValue(undefined),
    };

    mockPointRepo = {
      findByCustomerId: vi.fn().mockResolvedValue([]),
      getCurrentBalance: vi.fn().mockResolvedValue(10000), // 보유 10,000P
      recordTransaction: vi.fn().mockResolvedValue(undefined),
    };

    getAvailablePromotionsUseCase = new GetAvailablePromotionsUseCase(
      mockCouponRepo,
      mockPointRepo
    );
    calculatePromotionDiscountUseCase = new CalculatePromotionDiscountUseCase(
      mockCouponRepo,
      mockPointRepo
    );
  });

  describe('GetAvailablePromotionsUseCase', () => {
    it('주문 금액에 맞춰 사용 가능 및 불가 쿠폰 상태와 할인액을 계산한다', async () => {
      // 40,000원 주문 시:
      // coupon-1 (5000원 정액, 최소 3만) -> 사용 가능
      // coupon-2 (10% 정률, 최소 5만) -> 최소 금액 미달
      // coupon-3 (만료됨) -> 만료
      const result = await getAvailablePromotionsUseCase.execute('user-1', 40000);

      expect(result.availablePoints).toBe(10000);
      expect(result.maxPointsUsable).toBe(10000);
      expect(result.coupons).toHaveLength(3);

      const c1 = result.coupons.find((c) => c.id === 'coupon-1')!;
      expect(c1.isUsable).toBe(true);
      expect(c1.calculatedDiscount).toBe(5000);

      const c2 = result.coupons.find((c) => c.id === 'coupon-2')!;
      expect(c2.isUsable).toBe(false);
      expect(c2.unusableReason).toContain('최소 50,000원');

      const c3 = result.coupons.find((c) => c.id === 'coupon-3')!;
      expect(c3.isUsable).toBe(false);
      expect(c3.unusableReason).toContain('만료');
    });
  });

  describe('CalculatePromotionDiscountUseCase', () => {
    it('쿠폰과 적립금을 모두 적용하여 최종 결제 금액 및 적립 포인트를 정확히 계산한다', async () => {
      // 상품금액 60,000원, 배송비 0원
      // 10% 쿠폰(coupon-2) -> 6,000원 할인 (남은 상품금액: 54,000원)
      // 적립금 4,000P 사용
      // 총 할인: 10,000원, 최종 결제: 50,000원
      // 적립 예정 포인트: 50,000원의 1% = 500P
      const result = await calculatePromotionDiscountUseCase.execute('user-1', {
        orderAmount: 60000,
        shippingFee: 0,
        couponId: 'coupon-2',
        pointsToUse: 4000,
      });

      expect(result.isSuccess).toBe(true);
      const data = result.getValue();
      expect(data.productAmount).toBe(60000);
      expect(data.couponDiscount).toBe(6000);
      expect(data.pointsDiscount).toBe(4000);
      expect(data.totalDiscount).toBe(10000);
      expect(data.finalPaymentAmount).toBe(50000);
      expect(data.expectedRewardPoints).toBe(500);
      expect(data.appliedCoupon?.name).toBe('10% 정률 쿠폰');
    });

    it('보유 적립금을 초과하여 사용하려 하면 실패한다', async () => {
      const result = await calculatePromotionDiscountUseCase.execute('user-1', {
        orderAmount: 50000,
        shippingFee: 3000,
        pointsToUse: 15000, // 보유 포인트는 10,000P
      });

      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('보유 적립금');
    });

    it('적립금 사용 금액이 쿠폰 적용 후 남은 결제 금액을 초과할 수 없다', async () => {
      // 상품 30,000원 - 쿠폰 5,000원 = 남은 금액 25,000원
      // 적립금 30,000P 사용 시도 (보유 포인트가 50,000P라 가정)
      mockPointRepo.getCurrentBalance = vi.fn().mockResolvedValue(50000);

      const result = await calculatePromotionDiscountUseCase.execute('user-1', {
        orderAmount: 30000,
        shippingFee: 0,
        couponId: 'coupon-1',
        pointsToUse: 26000,
      });

      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('남은 결제 금액');
    });

    it('만료된 쿠폰을 적용하려 하면 실패한다', async () => {
      const result = await calculatePromotionDiscountUseCase.execute('user-1', {
        orderAmount: 50000,
        shippingFee: 3000,
        couponId: 'coupon-3',
      });

      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('만료된 쿠폰');
    });
  });
});
