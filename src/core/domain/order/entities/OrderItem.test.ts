import { describe, it, expect } from 'vitest';
import { OrderItem } from './OrderItem';
import { Money } from '../../catalog/value-objects/Money';

describe('OrderItem Entity', () => {
  it('주문 품목을 정상 생성하고 최종 결제 금액(단가 * 수량 - 할인)을 정확히 계산한다', () => {
    const item = OrderItem.create({
      productId: 'prod-1',
      variantId: 'var-1',
      productName: '캐시미어 코트',
      variantName: '블랙 / L',
      skuCode: 'COAT-BLK-L',
      unitPrice: Money.create(150000),
      quantity: 2,
      discountAmount: Money.create(10000),
    }).getValue();

    expect(item.productName).toBe('캐시미어 코트');
    expect(item.quantity).toBe(2);
    // 150,000 * 2 - 10,000 = 290,000원
    expect(item.totalPrice.amount).toBe(290000);
    expect(item.status).toBe('ORDERED');
  });

  it('수량이 0 이하일 경우 생성이 거부된다', () => {
    const result = OrderItem.create({
      productName: '상품',
      unitPrice: Money.create(10000),
      quantity: 0,
      discountAmount: Money.zero(),
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError().message).toContain('수량은 1개 이상');
  });
});

