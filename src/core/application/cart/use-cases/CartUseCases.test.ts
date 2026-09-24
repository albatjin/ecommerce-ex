import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryCartRepository } from '../../../infrastructure/repositories/MemoryCartRepository';
import { GetCartUseCase } from './GetCartUseCase';
import { AddToCartUseCase } from './AddToCartUseCase';
import { UpdateCartItemQuantityUseCase } from './UpdateCartItemQuantityUseCase';
import { RemoveCartItemUseCase } from './RemoveCartItemUseCase';
import { ToggleCartItemUseCase } from './ToggleCartItemUseCase';
import { MergeCartUseCase } from './MergeCartUseCase';

describe('Cart Use Cases with Clean Architecture', () => {
  let cartRepository: MemoryCartRepository;
  let getCartUseCase: GetCartUseCase;
  let addToCartUseCase: AddToCartUseCase;
  let updateQuantityUseCase: UpdateCartItemQuantityUseCase;
  let removeCartItemUseCase: RemoveCartItemUseCase;
  let toggleCartItemUseCase: ToggleCartItemUseCase;
  let mergeCartUseCase: MergeCartUseCase;

  beforeEach(() => {
    cartRepository = new MemoryCartRepository();
    getCartUseCase = new GetCartUseCase(cartRepository);
    addToCartUseCase = new AddToCartUseCase(cartRepository);
    updateQuantityUseCase = new UpdateCartItemQuantityUseCase(cartRepository);
    removeCartItemUseCase = new RemoveCartItemUseCase(cartRepository);
    toggleCartItemUseCase = new ToggleCartItemUseCase(cartRepository);
    mergeCartUseCase = new MergeCartUseCase(cartRepository);
  });

  it('GetCartUseCase: 빈 장바구니를 안전하게 반환한다', async () => {
    const cart = await getCartUseCase.execute('user_1');
    expect(cart.items).toHaveLength(0);
    expect(cart.totalItemCount).toBe(0);
    expect(cart.totalProductAmount).toBe(0);
    expect(cart.totalShippingFee).toBe(0);
  });

  it('AddToCartUseCase: 상품을 장바구니에 담고 금액을 올바르게 계산한다', async () => {
    const result = await addToCartUseCase.execute({
      cartIdOrUserId: 'cart_1',
      productId: 'prod_1',
      variantId: 'var_1',
      productName: '캐시미어 코트',
      variantName: '블랙 / L',
      price: 120000,
      quantity: 1,
      shippingFee: 3000,
    });

    expect(result.isSuccess).toBe(true);
    const cart = result.getValue();
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].productName).toBe('캐시미어 코트');
    expect(cart.totalProductAmount).toBe(120000);
    // 50,000원 이상이므로 무료배송
    expect(cart.totalShippingFee).toBe(0);
    expect(cart.totalPaymentAmount).toBe(120000);
  });

  it('UpdateCartItemQuantityUseCase: 담긴 품목의 수량을 안전하게 변경한다', async () => {
    const addResult = await addToCartUseCase.execute({
      cartIdOrUserId: 'cart_1',
      productId: 'prod_1',
      productName: '티셔츠',
      price: 20000,
      quantity: 1,
      shippingFee: 3000,
    });
    const itemId = addResult.getValue().items[0].id;

    const updateResult = await updateQuantityUseCase.execute({
      cartIdOrUserId: 'cart_1',
      itemId,
      quantity: 3,
    });

    expect(updateResult.isSuccess).toBe(true);
    const updated = updateResult.getValue();
    expect(updated.items[0].quantity).toBe(3);
    expect(updated.totalProductAmount).toBe(60000);
    // 60,000원이므로 무료배송 적용
    expect(updated.totalShippingFee).toBe(0);
  });

  it('RemoveCartItemUseCase: 단일 품목 삭제 및 선택 품목 일괄 삭제가 동작한다', async () => {
    await addToCartUseCase.execute({
      cartIdOrUserId: 'cart_1',
      productId: 'prod_1',
      productName: '상품 1',
      price: 10000,
      quantity: 1,
    });
    const res2 = await addToCartUseCase.execute({
      cartIdOrUserId: 'cart_1',
      productId: 'prod_2',
      productName: '상품 2',
      price: 20000,
      quantity: 1,
    });
    const item2Id = res2.getValue().items[1].id;

    // 단일 삭제
    const cartAfterRemove = await removeCartItemUseCase.execute({
      cartIdOrUserId: 'cart_1',
      itemId: item2Id,
    });
    expect(cartAfterRemove.items).toHaveLength(1);
    expect(cartAfterRemove.items[0].productId).toBe('prod_1');

    // 전체 비우기
    const clearedCart = await removeCartItemUseCase.execute({
      cartIdOrUserId: 'cart_1',
    });
    expect(clearedCart.items).toHaveLength(0);
  });

  it('ToggleCartItemUseCase: 품목 선택/해제 및 전체 선택/해제가 동작한다', async () => {
    await addToCartUseCase.execute({
      cartIdOrUserId: 'cart_1',
      productId: 'prod_1',
      productName: '상품 1',
      price: 10000,
      quantity: 1,
    });

    // 전체 해제
    const unselected = await toggleCartItemUseCase.execute({
      cartIdOrUserId: 'cart_1',
      selectAll: false,
    });
    expect(unselected.isAllSelected).toBe(false);
    expect(unselected.totalProductAmount).toBe(0);

    // 단일 재선택
    const itemId = unselected.items[0].id;
    const reselected = await toggleCartItemUseCase.execute({
      cartIdOrUserId: 'cart_1',
      itemId,
      selected: true,
    });
    expect(reselected.isAllSelected).toBe(true);
    expect(reselected.totalProductAmount).toBe(10000);
  });

  it('MergeCartUseCase: 비회원 장바구니를 회원 장바구니로 병합하고 비회원 저장소를 비운다', async () => {
    // 게스트가 상품 담기
    await addToCartUseCase.execute({
      cartIdOrUserId: 'guest_token_123',
      productId: 'prod_1',
      productName: '게스트가 담은 코트',
      price: 50000,
      quantity: 1,
    });

    // 회원이 기존에 담은 상품
    await addToCartUseCase.execute({
      cartIdOrUserId: 'user_456',
      productId: 'prod_2',
      productName: '회원이 담은 셔츠',
      price: 30000,
      quantity: 2,
    });

    // 로그인 시 병합 실행
    const merged = await mergeCartUseCase.execute({
      guestCartId: 'guest_token_123',
      userCartId: 'user_456',
    });

    expect(merged.items).toHaveLength(2);
    expect(merged.totalItemCount).toBe(3);

    // 게스트 장바구니가 비워졌는지 확인
    const guestCart = await getCartUseCase.execute('guest_token_123');
    expect(guestCart.items).toHaveLength(0);
  });
});

