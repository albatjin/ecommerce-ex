'use server';

import { getServerClient } from '@/core/infrastructure/supabase/server';
import { SupabaseCouponRepository } from '@/core/infrastructure/repositories/SupabaseCouponRepository';
import { SupabasePointRepository } from '@/core/infrastructure/repositories/SupabasePointRepository';
import { GetAvailablePromotionsUseCase } from '@/core/application/promotion/use-cases/GetAvailablePromotionsUseCase';
import { CalculatePromotionDiscountUseCase } from '@/core/application/promotion/use-cases/CalculatePromotionDiscountUseCase';
import type {
  AvailablePromotionsDTO,
  CalculatePromotionInput,
  PromotionCalculationResultDTO,
} from '@/core/application/promotion/dtos/PromotionDTO';

export interface GetAvailablePromotionsActionResult {
  success: boolean;
  data?: AvailablePromotionsDTO;
  error?: string;
}

export interface CalculatePromotionDiscountActionResult {
  success: boolean;
  data?: PromotionCalculationResultDTO;
  error?: string;
}

/**
 * 로그인 회원의 주문 금액 기준 사용 가능 쿠폰 및 적립금 조회 Server Action
 */
export async function getAvailablePromotionsAction(
  orderAmount: number
): Promise<GetAvailablePromotionsActionResult> {
  try {
    const supabase = await getServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return {
        success: true,
        data: {
          coupons: [],
          availablePoints: 0,
          maxPointsUsable: 0,
        },
      };
    }

    const couponRepo = new SupabaseCouponRepository();
    const pointRepo = new SupabasePointRepository();
    const useCase = new GetAvailablePromotionsUseCase(couponRepo, pointRepo);

    const data = await useCase.execute(user.id, orderAmount);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '프로모션 정보를 조회하지 못했습니다.',
    };
  }
}

/**
 * 주문서 쿠폰 할인 및 적립금 적용 금액 실시간 계산 Server Action
 */
export async function calculatePromotionDiscountAction(
  input: CalculatePromotionInput
): Promise<CalculatePromotionDiscountActionResult> {
  try {
    const supabase = await getServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      // 비회원은 쿠폰/적립금 적용 불가 -> 기본 금액 반환
      const finalProductAmount = Math.max(0, input.orderAmount);
      return {
        success: true,
        data: {
          productAmount: input.orderAmount,
          shippingFee: input.shippingFee,
          couponDiscount: 0,
          pointsDiscount: 0,
          totalDiscount: 0,
          finalPaymentAmount: finalProductAmount + input.shippingFee,
          expectedRewardPoints: 0,
          appliedCoupon: null,
        },
      };
    }

    const couponRepo = new SupabaseCouponRepository();
    const pointRepo = new SupabasePointRepository();
    const useCase = new CalculatePromotionDiscountUseCase(couponRepo, pointRepo);

    const result = await useCase.execute(user.id, input);

    if (result.isFailure) {
      return { success: false, error: result.getError().message };
    }

    return { success: true, data: result.getValue() };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '할인 금액을 계산하지 못했습니다.',
    };
  }
}

