import type { ICouponRepository } from '../../../domain/promotion/repositories/ICouponRepository';
import type { IPointRepository } from '../../../domain/promotion/repositories/IPointRepository';
import { Result, ok, fail } from '../../../domain/shared/Result';
import { DomainError } from '../../../domain/shared/AppError';
import type {
  CalculatePromotionInput,
  PromotionCalculationResultDTO,
} from '../dtos/PromotionDTO';

export class CalculatePromotionDiscountUseCase {
  constructor(
    private readonly couponRepository: ICouponRepository,
    private readonly pointRepository: IPointRepository
  ) {}

  public async execute(
    customerId: string,
    input: CalculatePromotionInput
  ): Promise<Result<PromotionCalculationResultDTO, DomainError>> {
    if (input.orderAmount < 0) {
      return fail(new DomainError('주문 금액은 0원 이상이어야 합니다.'));
    }
    if (input.shippingFee < 0) {
      return fail(new DomainError('배송비는 0원 이상이어야 합니다.'));
    }

    const pointsToUse = input.pointsToUse || 0;
    if (pointsToUse < 0) {
      return fail(new DomainError('사용할 적립금은 0보다 작을 수 없습니다.'));
    }

    let couponDiscount = 0;
    let appliedCoupon: { id: string; name: string; discountAmount: number } | null = null;

    // 1. 쿠폰 할인 검증 및 산출
    if (input.couponId) {
      const coupon = await this.couponRepository.findById(input.couponId);
      if (!coupon) {
        return fail(new DomainError('해당 쿠폰을 찾을 수 없습니다.'));
      }
      if (coupon.customerId !== customerId) {
        return fail(new DomainError('본인에게 발급된 쿠폰만 사용할 수 있습니다.'));
      }
      if (coupon.isUsed) {
        return fail(new DomainError('이미 사용된 쿠폰입니다.'));
      }
      if (coupon.isExpired()) {
        return fail(new DomainError('사용 기한이 만료된 쿠폰입니다.'));
      }
      if (input.orderAmount < coupon.minOrderAmount) {
        return fail(
          new DomainError(
            `최소 주문 금액(${coupon.minOrderAmount.toLocaleString()}원)을 충족하지 못했습니다.`
          )
        );
      }

      const calculated = coupon.calculateDiscount(input.orderAmount);
      couponDiscount = calculated.amount;
      appliedCoupon = {
        id: coupon.id,
        name: coupon.name,
        discountAmount: couponDiscount,
      };
    }

    // 2. 적립금 사용 검증 및 산출
    let pointsDiscount = 0;
    if (pointsToUse > 0) {
      const currentBalance = await this.pointRepository.getCurrentBalance(customerId);
      if (pointsToUse > currentBalance) {
        return fail(
          new DomainError(
            `보유 적립금(${currentBalance.toLocaleString()}P)을 초과하여 사용할 수 없습니다.`
          )
        );
      }

      const remainingAmountAfterCoupon = Math.max(0, input.orderAmount - couponDiscount);
      if (pointsToUse > remainingAmountAfterCoupon) {
        return fail(
          new DomainError(
            `사용할 적립금(${pointsToUse.toLocaleString()}P)이 쿠폰 적용 후 남은 결제 금액(${remainingAmountAfterCoupon.toLocaleString()}원)을 초과할 수 없습니다.`
          )
        );
      }

      pointsDiscount = pointsToUse;
    }

    const totalDiscount = couponDiscount + pointsDiscount;
    const finalProductAmount = Math.max(0, input.orderAmount - totalDiscount);
    const finalPaymentAmount = finalProductAmount + input.shippingFee;
    const expectedRewardPoints = Math.floor(finalProductAmount * 0.01);

    return ok({
      productAmount: input.orderAmount,
      shippingFee: input.shippingFee,
      couponDiscount,
      pointsDiscount,
      totalDiscount,
      finalPaymentAmount,
      expectedRewardPoints,
      appliedCoupon,
    });
  }
}

