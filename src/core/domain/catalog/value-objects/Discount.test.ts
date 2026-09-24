import { describe, it, expect } from 'vitest';
import { Discount } from './Discount';
import { Money } from './Money';

describe('Discount Value Object', () => {
  it('정가와 판매가를 통해 할인율을 자동으로 계산한다', () => {
    const regular = Money.create(100000);
    const sale = Money.create(70000);

    const discount = Discount.create(regular, sale);
    expect(discount.discountRate).toBe(30);
    expect(discount.hasDiscount()).toBe(true);
    expect(discount.discountAmount.amount).toBe(30000);
  });

  it('판매가가 정가보다 높으면 DomainError를 던진다', () => {
    const regular = Money.create(50000);
    const sale = Money.create(60000);

    expect(() => Discount.create(regular, sale)).toThrow('판매가는 정가보다 클 수 없습니다.');
  });

  it('정가와 판매가가 동일하면 할인율은 0이다', () => {
    const regular = Money.create(50000);
    const sale = Money.create(50000);

    const discount = Discount.create(regular, sale);
    expect(discount.discountRate).toBe(0);
    expect(discount.hasDiscount()).toBe(false);
  });
});

