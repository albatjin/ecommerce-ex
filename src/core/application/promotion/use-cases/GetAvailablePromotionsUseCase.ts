import type { ICouponRepository } from '../../../domain/promotion/repositories/ICouponRepository';
import type { IPointRepository } from '../../../domain/promotion/repositories/IPointRepository';
import type {
  AvailablePromotionsDTO,
  AvailableCouponDTO,
} from '../dtos/PromotionDTO';

export class GetAvailablePromotionsUseCase {
  constructor(
    private readonly couponRepository: ICouponRepository,
    private readonly pointRepository: IPointRepository
  ) {}

  public async execute(
    customerId: string,
    orderAmount: number
  ): Promise<AvailablePromotionsDTO> {
    const [coupons, availablePoints] = await Promise.all([
      this.couponRepository.findAvailableByCustomerId(customerId),
      this.pointRepository.getCurrentBalance(customerId),
    ]);

    const now = new Date();
    const couponDTOs: AvailableCouponDTO[] = coupons.map((coupon) => {
      const isExpired = coupon.isExpired(now);
      const isBelowMin = orderAmount < coupon.minOrderAmount;
      const isUsable = !isExpired && !isBelowMin && !coupon.isUsed;

      let unusableReason: string | undefined;
      if (coupon.isUsed) {
        unusableReason = '이미 사용된 쿠폰입니다.';
      } else if (isExpired) {
        unusableReason = '사용 기한이 만료된 쿠폰입니다.';
      } else if (isBelowMin) {
        unusableReason = `최소 ${coupon.minOrderAmount.toLocaleString()}원 이상 구매 시 사용 가능`;
      }

      const calculatedDiscount = isUsable
        ? coupon.calculateDiscount(orderAmount, now).amount
        : 0;

      return {
        id: coupon.id,
        name: coupon.name,
        discountAmount: coupon.discountAmount,
        discountRate: coupon.discountRate,
        minOrderAmount: coupon.minOrderAmount,
        calculatedDiscount,
        isUsable,
        unusableReason,
        expiresAt: coupon.expiresAt.toISOString(),
      };
    });

    const maxPointsUsable = Math.min(availablePoints, Math.max(0, orderAmount));

    return {
      coupons: couponDTOs,
      availablePoints,
      maxPointsUsable,
    };
  }
}
