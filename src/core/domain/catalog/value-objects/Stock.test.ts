import { describe, it, expect } from 'vitest';
import { Stock } from './Stock';

describe('Stock Value Object', () => {
  it('재고 수량과 안전 재고를 생성한다', () => {
    const stock = Stock.create(100, 10);
    expect(stock.quantity).toBe(100);
    expect(stock.safetyStock).toBe(10);
    expect(stock.isOutOfStock()).toBe(false);
    expect(stock.isLowStock()).toBe(false);
  });

  it('재고가 0 이하이면 isOutOfStock이 true이다', () => {
    const stock = Stock.create(0);
    expect(stock.isOutOfStock()).toBe(true);
  });

  it('재고가 안전재고 이하이고 0보다 크면 isLowStock이 true이다', () => {
    const stock = Stock.create(5, 10);
    expect(stock.isOutOfStock()).toBe(false);
    expect(stock.isLowStock()).toBe(true);
  });

  it('deduct: 재고를 차감하고 부족 시 DomainError를 던진다', () => {
    const stock = Stock.create(20);
    const deducted = stock.deduct(15);
    expect(deducted.quantity).toBe(5);

    expect(() => stock.deduct(25)).toThrow('재고가 부족합니다');
  });

  it('restock: 재고를 추가 입고한다', () => {
    const stock = Stock.create(10);
    const restocked = stock.restock(30);
    expect(restocked.quantity).toBe(40);
  });
});
