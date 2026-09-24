'use server';

import { revalidatePath } from 'next/cache';
import { getServerClient } from '@/core/infrastructure/supabase/server';
import { getCartSessionId } from './cart.actions';
import { CookieCartRepository } from '@/core/infrastructure/repositories/CookieCartRepository';
import { SupabaseOrderRepository } from '@/core/infrastructure/repositories/SupabaseOrderRepository';
import { SupabaseProductRepository } from '@/core/infrastructure/repositories/SupabaseProductRepository';
import { SupabaseCouponRepository } from '@/core/infrastructure/repositories/SupabaseCouponRepository';
import { SupabasePointRepository } from '@/core/infrastructure/repositories/SupabasePointRepository';
import { MockPaymentGateway } from '@/core/infrastructure/gateways/MockPaymentGateway';
import {
  CreateOrderUseCase,
  type CreateOrderItemInput,
  type CreateOrderOutput,
} from '@/core/application/order/use-cases/CreateOrderUseCase';
import {
  ApprovePaymentUseCase,
  type ApprovePaymentOutput,
} from '@/core/application/order/use-cases/ApprovePaymentUseCase';
import type { PlaceOrderInput } from '@/core/application/order/dtos/CheckoutDTO';

export interface OrderActionResult {
  success: boolean;
  data?: CreateOrderOutput;
  error?: string;
}

export interface ApprovePaymentActionResult {
  success: boolean;
  data?: ApprovePaymentOutput;
  error?: string;
}

export interface CreateOrderActionInput extends PlaceOrderInput {
  items?: CreateOrderItemInput[];
}

/**
 * 신규 주문을 생성하고 재고 차감 및 프로모션(쿠폰/적립금)을 반영합니다.
 */
export async function createOrderAction(
  input: CreateOrderActionInput
): Promise<OrderActionResult> {
  try {
    const supabase = await getServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { cartId } = await getCartSessionId();
    const cartRepo = new CookieCartRepository();

    // 주문 품목 확정: 입력 품목이 없으면 현재 장바구니의 선택 품목 사용
    let orderItems = input.items;
    if (!orderItems || orderItems.length === 0) {
      const cart = await cartRepo.getCart(cartId);
      const selectedItems = cart.selectedItems();
      if (selectedItems.length === 0) {
        return {
          success: false,
          error: '주문할 상품이 장바구니에 선택되어 있지 않습니다.',
        };
      }
      orderItems = selectedItems.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
      }));
    }

    const orderRepo = new SupabaseOrderRepository(supabase);
    const productRepo = new SupabaseProductRepository(supabase);
    const couponRepo = new SupabaseCouponRepository(supabase);
    const pointRepo = new SupabasePointRepository(supabase);

    const useCase = new CreateOrderUseCase(
      orderRepo,
      productRepo,
      couponRepo,
      pointRepo,
      cartRepo
    );

    const result = await useCase.execute({
      customerId: user?.id ?? null,
      cartId,
      items: orderItems,
      shippingAddress: input.shippingAddress,
      paymentMethod: input.paymentMethod,
      couponId: input.couponId,
      pointsToUse: input.pointsToUse,
    });

    if (result.isFailure) {
      return {
        success: false,
        error: result.getError().message,
      };
    }

    revalidatePath('/cart');
    revalidatePath('/checkout');
    revalidatePath('/my-page');

    return {
      success: true,
      data: result.getValue(),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : '주문 생성 중 예기치 않은 오류가 발생했습니다.',
    };
  }
}

/**
 * PG사 결제 승인을 요청하고 주문 상태를 결제완료(PAID)로 전환합니다.
 */
export async function approvePaymentAction(
  orderId: string,
  paymentDetails?: Record<string, unknown>
): Promise<ApprovePaymentActionResult> {
  try {
    const supabase = await getServerClient();
    const orderRepo = new SupabaseOrderRepository(supabase);
    const productRepo = new SupabaseProductRepository(supabase);
    const pointRepo = new SupabasePointRepository(supabase);
    const paymentGateway = new MockPaymentGateway();

    const useCase = new ApprovePaymentUseCase(
      orderRepo,
      paymentGateway,
      productRepo,
      pointRepo
    );

    const result = await useCase.execute({
      orderId,
      paymentDetails,
    });

    if (result.isFailure) {
      return {
        success: false,
        error: result.getError().message,
      };
    }

    revalidatePath('/cart');
    revalidatePath('/checkout');
    revalidatePath('/my-page');

    return {
      success: true,
      data: result.getValue(),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : '결제 승인 처리 중 예기치 않은 오류가 발생했습니다.',
    };
  }
}
