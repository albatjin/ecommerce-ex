'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { CookieCartRepository } from '@/core/infrastructure/repositories/CookieCartRepository';
import { GetCartUseCase } from '@/core/application/cart/use-cases/GetCartUseCase';
import { AddToCartUseCase } from '@/core/application/cart/use-cases/AddToCartUseCase';
import { UpdateCartItemQuantityUseCase } from '@/core/application/cart/use-cases/UpdateCartItemQuantityUseCase';
import { RemoveCartItemUseCase } from '@/core/application/cart/use-cases/RemoveCartItemUseCase';
import { ToggleCartItemUseCase } from '@/core/application/cart/use-cases/ToggleCartItemUseCase';
import { MergeCartUseCase } from '@/core/application/cart/use-cases/MergeCartUseCase';
import { getServerClient } from '@/core/infrastructure/supabase/server';
import type { CartDTO, AddToCartInput } from '@/core/application/cart/dtos/CartDTO';

export interface CartActionResult {
  success: boolean;
  data?: CartDTO;
  error?: string;
}

const CART_SESSION_COOKIE = 'ecommerce_guest_token';

/**
 * 현재 세션의 장바구니 식별자(회원 ID 또는 게스트 토큰)를 안전하게 획득합니다.
 */
export async function getCartSessionId(): Promise<{ cartId: string; isGuest: boolean }> {
  try {
    const supabase = await getServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) {
      return { cartId: user.id, isGuest: false };
    }
  } catch {
    // Supabase 미인증 상태 시 게스트 세션 사용
  }

  const cookieStore = await cookies();
  let guestToken = cookieStore.get(CART_SESSION_COOKIE)?.value;
  if (!guestToken) {
    guestToken = `guest_${crypto.randomUUID()}`;
    try {
      cookieStore.set(CART_SESSION_COOKIE, guestToken, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30일 보관
      });
    } catch {
      // Server Component 렌더 중 set 예외 방어
    }
  }
  return { cartId: guestToken, isGuest: true };
}

/**
 * 장바구니 조회 Action
 */
export async function getCartAction(): Promise<CartActionResult> {
  try {
    const { cartId } = await getCartSessionId();
    const repository = new CookieCartRepository();
    const useCase = new GetCartUseCase(repository);
    const cart = await useCase.execute(cartId);

    return { success: true, data: cart };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '장바구니를 불러오지 못했습니다.',
    };
  }
}

/**
 * 장바구니 품목 추가 Action
 */
export async function addToCartAction(
  item: Omit<AddToCartInput, 'cartIdOrUserId'>
): Promise<CartActionResult> {
  try {
    const { cartId } = await getCartSessionId();
    const repository = new CookieCartRepository();
    const useCase = new AddToCartUseCase(repository);

    const result = await useCase.execute({
      ...item,
      cartIdOrUserId: cartId,
    });

    if (result.isFailure) {
      return { success: false, error: result.getError().message };
    }

    revalidatePath('/cart');
    return { success: true, data: result.getValue() };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '장바구니에 상품을 추가하지 못했습니다.',
    };
  }
}

/**
 * 장바구니 품목 수량 변경 Action
 */
export async function updateCartItemQuantityAction(
  itemId: string,
  quantity: number
): Promise<CartActionResult> {
  try {
    const { cartId } = await getCartSessionId();
    const repository = new CookieCartRepository();
    const useCase = new UpdateCartItemQuantityUseCase(repository);

    const result = await useCase.execute({
      cartIdOrUserId: cartId,
      itemId,
      quantity,
    });

    if (result.isFailure) {
      return { success: false, error: result.getError().message };
    }

    revalidatePath('/cart');
    return { success: true, data: result.getValue() };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '수량을 변경하지 못했습니다.',
    };
  }
}

/**
 * 장바구니 품목 삭제 Action (단일 삭제 / 선택 삭제 / 전체 비우기)
 */
export async function removeCartItemAction(
  options: { itemId?: string; selectedOnly?: boolean } = {}
): Promise<CartActionResult> {
  try {
    const { cartId } = await getCartSessionId();
    const repository = new CookieCartRepository();
    const useCase = new RemoveCartItemUseCase(repository);

    const cart = await useCase.execute({
      cartIdOrUserId: cartId,
      itemId: options.itemId,
      selectedOnly: options.selectedOnly,
    });

    revalidatePath('/cart');
    return { success: true, data: cart };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '품목을 삭제하지 못했습니다.',
    };
  }
}

/**
 * 장바구니 품목 선택 여부 토글 Action (단일 품목 토글 또는 전체 선택/해제)
 */
export async function toggleCartItemAction(
  options: { itemId?: string; selectAll?: boolean; selected?: boolean }
): Promise<CartActionResult> {
  try {
    const { cartId } = await getCartSessionId();
    const repository = new CookieCartRepository();
    const useCase = new ToggleCartItemUseCase(repository);

    const cart = await useCase.execute({
      cartIdOrUserId: cartId,
      itemId: options.itemId,
      selectAll: options.selectAll,
      selected: options.selected,
    });

    revalidatePath('/cart');
    return { success: true, data: cart };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '선택 상태를 변경하지 못했습니다.',
    };
  }
}

/**
 * 게스트 장바구니를 로그인 회원 장바구니로 병합 Action
 */
export async function mergeCartAction(guestToken: string): Promise<CartActionResult> {
  try {
    const supabase = await getServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return { success: false, error: '회원 인증 정보가 필요합니다.' };
    }

    const repository = new CookieCartRepository();
    const useCase = new MergeCartUseCase(repository);

    const cart = await useCase.execute({
      guestCartId: guestToken,
      userCartId: user.id,
    });

    // 게스트 토큰 쿠키 정리
    const cookieStore = await cookies();
    cookieStore.delete(CART_SESSION_COOKIE);

    revalidatePath('/cart');
    return { success: true, data: cart };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '장바구니 병합에 실패했습니다.',
    };
  }
}

