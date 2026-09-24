import { describe, it, expect } from 'vitest';
import { CartItem } from './CartItem';
import { Money } from '../../catalog/value-objects/Money';

describe('CartItem Entity', () => {
  const createSampleItem = (quantity = 2) => {
    return CartItem.create({
      productId: 'prod-1',
      variantId: 'var-1',
      productName: '캐시미어 니트',
      variantName: '블랙 / L',
      price: Money.create(50000),
      quantity,
      coverImageUrl: 'https://example.com/knit.jpg',
      shippingFee: Money.create(3000),
    }).getValue();
  };

  it('장바구니 품목을 정상 생성하고 소계(단가 * 수량)를 정확히 계산한다', () => {
    const item = createSampleItem(3);

    expect(item.productId).toBe('prod-1');
    expect(item.variantId).toBe('var-1');
    expect(item.productName).toBe('캐시미어 니트');
    expect(item.price.amount).toBe(50000);
    expect(item.quantity).toBe(3);
    expect(item.subtotal().amount).toBe(150000);
    expect(item.selected).toBe(true);
    expect(item.getItemKey()).toBe('prod-1_var-1');
  });

  it('updateQuantity: 수량을 1~99 범위 내에서 안전하게 변경한다', () => {
    const item = createSampleItem(2);

    expect(item.updateQuantity(5).isSuccess).toBe(true);
    expect(item.quantity).toBe(5);
    expect(item.subtotal().amount).toBe(250000);

    // 0 이하 불가
    const zeroResult = item.updateQuantity(0);
    expect(zeroResult.isFailure).toBe(true);
    expect(zeroResult.getError().message).toContain('1개 이상');

    // 100개 초과 불가
    const overflowResult = item.updateQuantity(100);
    expect(overflowResult.isFailure).toBe(true);
    expect(overflowResult.getError().message).toContain('99개');
  });

  it('addQuantity: 기존 수량에 누적 추가한다', () => {
    const item = createSampleItem(2);
    item.addQuantity(3);
    expect(item.quantity).toBe(5);
  });

  it('toggleSelect 및 setSelected: 선택 여부를 올바르게 변경한다', () => {
    const item = createSampleItem();
    expect(item.selected).toBe(true);

    item.toggleSelect();
    expect(item.selected).toBe(false);

    item.setSelected(true);
    expect(item.selected).toBe(true);
  });
});

