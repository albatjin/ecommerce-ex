import { describe, it, expect } from 'vitest';
import { Cart } from './Cart';
import { CartItem } from './CartItem';
import { Money } from '../../catalog/value-objects/Money';

describe('Cart Aggregate Root', () => {
  const createCartItem = (
    productId: string,
    variantId: string | undefined,
    price: number,
    quantity: number,
    shippingFee = 3000
  ) => {
    return CartItem.create({
      productId,
      variantId,
      productName: `상품 ${productId}`,
      variantName: variantId ? `옵션 ${variantId}` : undefined,
      price: Money.create(price),
      quantity,
      shippingFee: Money.create(shippingFee),
    }).getValue();
  };

  it('빈 장바구니를 정상 생성한다', () => {
    const cart = Cart.create().getValue();
    expect(cart.items).toHaveLength(0);
    expect(cart.totalItemCount()).toBe(0);
    expect(cart.totalProductAmount().amount).toBe(0);
    expect(cart.totalShippingFee().amount).toBe(0);
    expect(cart.totalPaymentAmount().amount).toBe(0);
    expect(cart.isAllSelected()).toBe(false);
  });

  describe('addItem & updateItemQuantity & removeItem', () => {
    it('새로운 품목을 장바구니에 추가한다', () => {
      const cart = Cart.create().getValue();
      const item1 = createCartItem('p1', 'v1', 20000, 1);
      const item2 = createCartItem('p2', undefined, 15000, 2);

      cart.addItem(item1);
      cart.addItem(item2);

      expect(cart.items).toHaveLength(2);
      expect(cart.totalItemCount()).toBe(3);
    });

    it('동일한 상품 및 옵션이 다시 추가되면 수량을 누적 합산한다', () => {
      const cart = Cart.create().getValue();
      const item1 = createCartItem('p1', 'v1', 20000, 1);
      const item2 = createCartItem('p1', 'v1', 20000, 3);

      cart.addItem(item1);
      cart.addItem(item2);

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(4);
      expect(cart.totalItemCount()).toBe(4);
    });

    it('품목 수량을 정상적으로 업데이트한다', () => {
      const cart = Cart.create().getValue();
      const item = createCartItem('p1', 'v1', 20000, 2);
      cart.addItem(item);

      const result = cart.updateItemQuantity(item.id, 5);
      expect(result.isSuccess).toBe(true);
      expect(cart.items[0].quantity).toBe(5);

      // 존재하지 않는 품목 업데이트 시 실패
      const notFoundResult = cart.updateItemQuantity('non-existent', 3);
      expect(notFoundResult.isFailure).toBe(true);
      expect(notFoundResult.getError().message).toContain('찾을 수 없습니다');
    });

    it('특정 품목을 장바구니에서 삭제한다', () => {
      const cart = Cart.create().getValue();
      const item1 = createCartItem('p1', 'v1', 20000, 1);
      const item2 = createCartItem('p2', undefined, 15000, 2);

      cart.addItem(item1);
      cart.addItem(item2);

      cart.removeItem(item1.id);
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].id).toBe(item2.id);
    });

    it('선택된 품목만 일괄 삭제한다', () => {
      const cart = Cart.create().getValue();
      const item1 = createCartItem('p1', 'v1', 20000, 1);
      const item2 = createCartItem('p2', undefined, 15000, 2);

      cart.addItem(item1);
      cart.addItem(item2);

      // item1만 선택 해제
      item1.setSelected(false);
      expect(item1.selected).toBe(false);
      expect(item2.selected).toBe(true);

      // 선택된 품목(item2) 삭제
      cart.removeSelectedItems();
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].id).toBe(item1.id);
    });

    it('clear: 장바구니를 완전히 비운다', () => {
      const cart = Cart.create().getValue();
      cart.addItem(createCartItem('p1', 'v1', 20000, 1));
      cart.addItem(createCartItem('p2', undefined, 15000, 2));

      cart.clear();
      expect(cart.items).toHaveLength(0);
      expect(cart.totalItemCount()).toBe(0);
    });
  });

  describe('선택 및 토글 기능', () => {
    it('selectAll 및 isAllSelected가 정상 동작한다', () => {
      const cart = Cart.create().getValue();
      const item1 = createCartItem('p1', 'v1', 20000, 1);
      const item2 = createCartItem('p2', undefined, 15000, 2);
      cart.addItem(item1);
      cart.addItem(item2);

      expect(cart.isAllSelected()).toBe(true);

      cart.selectAll(false);
      expect(cart.isAllSelected()).toBe(false);
      expect(cart.selectedItems()).toHaveLength(0);

      cart.toggleItemSelect(item1.id);
      expect(cart.items[0].selected).toBe(true);
      expect(cart.items[1].selected).toBe(false);
      expect(cart.isAllSelected()).toBe(false);

      cart.selectAll(true);
      expect(cart.isAllSelected()).toBe(true);
      expect(cart.selectedItems()).toHaveLength(2);
    });
  });

  describe('금액 및 무료배송 계산 정책', () => {
    it('선택된 상품 합계가 50,000원 미만일 경우 최대 배송비가 부과된다', () => {
      const cart = Cart.create().getValue();
      // 상품1: 20,000원, 배송비 3,000원
      const item1 = createCartItem('p1', 'v1', 20000, 1, 3000);
      // 상품2: 15,000원, 배송비 2,500원
      const item2 = createCartItem('p2', undefined, 15000, 1, 2500);

      cart.addItem(item1);
      cart.addItem(item2);

      // 상품합계: 35,000원
      expect(cart.totalProductAmount().amount).toBe(35000);
      // 최대 배송비 3,000원 적용
      expect(cart.totalShippingFee().amount).toBe(3000);
      // 결제 예정 총액: 38,000원
      expect(cart.totalPaymentAmount().amount).toBe(38000);
    });

    it('선택된 상품 합계가 50,000원 이상일 경우 무료 배송(0원)이 적용된다', () => {
      const cart = Cart.create().getValue();
      // 상품1: 30,000원 * 2 = 60,000원, 배송비 3,000원
      const item = createCartItem('p1', 'v1', 30000, 2, 3000);
      cart.addItem(item);

      expect(cart.totalProductAmount().amount).toBe(60000);
      expect(cart.totalShippingFee().amount).toBe(0);
      expect(cart.totalPaymentAmount().amount).toBe(60000);
    });

    it('선택 해제된 품목은 금액 및 배송비 계산에서 제외된다', () => {
      const cart = Cart.create().getValue();
      const item1 = createCartItem('p1', 'v1', 60000, 1, 3000);
      const item2 = createCartItem('p2', undefined, 20000, 1, 2500);

      cart.addItem(item1);
      cart.addItem(item2);

      // 60,000원짜리 item1 선택 해제
      cart.toggleItemSelect(item1.id);

      // 남은 선택 품목은 item2(20,000원) 하나이므로 5만원 미만 -> 배송비 2,500원 부과
      expect(cart.totalProductAmount().amount).toBe(20000);
      expect(cart.totalShippingFee().amount).toBe(2500);
      expect(cart.totalPaymentAmount().amount).toBe(22500);
    });
  });

  describe('merge (게스트 장바구니 동기화)', () => {
    it('로그인 시 게스트 장바구니 품목을 회원 장바구니로 안전하게 합산 병합한다', () => {
      // 회원 장바구니 (기존에 p1 1개 보유)
      const memberCart = Cart.create({ userId: 'user-123' }).getValue();
      const memberItem = createCartItem('p1', 'v1', 20000, 1);
      memberCart.addItem(memberItem);

      // 비회원 장바구니 (p1 2개, p2 1개 보유)
      const guestCart = Cart.create({ userId: null }).getValue();
      const guestItem1 = createCartItem('p1', 'v1', 20000, 2);
      const guestItem2 = createCartItem('p2', undefined, 10000, 1);
      guestCart.addItem(guestItem1);
      guestCart.addItem(guestItem2);

      // 병합 수행
      memberCart.merge(guestCart);

      expect(memberCart.items).toHaveLength(2);
      // p1은 1개 + 2개 = 3개로 누적
      const mergedP1 = memberCart.items.find((i) => i.getItemKey() === 'p1_v1');
      expect(mergedP1?.quantity).toBe(3);

      // p2는 신규 추가
      const mergedP2 = memberCart.items.find((i) => i.productId === 'p2');
      expect(mergedP2?.quantity).toBe(1);
    });
  });
});
