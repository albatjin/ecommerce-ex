import { describe, it, expect } from 'vitest';
import { Money } from './Money';

describe('Money Value Object', () => {
  it('금액을 정상적으로 생성하고 포맷팅한다', () => {
    const money = Money.create(50000);
    expect(money.amount).toBe(50000);
    expect(money.currency).toBe('KRW');
    expect(money.format()).toBe('50,000원');
  });

  it('음수 금액 생성 시 DomainError를 던진다', () => {
    expect(() => Money.create(-1000)).toThrow('금액은 음수일 수 없습니다.');
  });

  it('add: 두 금액을 더한다', () => {
    const m1 = Money.create(10000);
    const m2 = Money.create(25000);
    const sum = m1.add(m2);

    expect(sum.amount).toBe(35000);
  });

  it('subtract: 금액을 차감하며 차감액이 더 크면 예외를 던진다', () => {
    const m1 = Money.create(30000);
    const m2 = Money.create(10000);
    expect(m1.subtract(m2).amount).toBe(20000);

    expect(() => m2.subtract(m1)).toThrow('차감할 금액이 보유 금액보다 클 수 없습니다.');
  });

  it('multiply: 배수를 곱한다', () => {
    const money = Money.create(12000);
    expect(money.multiply(3).amount).toBe(36000);
  });

  it('화폐 단위가 다르면 연산 시 예외를 던진다', () => {
    const krw = Money.create(1000, 'KRW');
    const usd = Money.create(10, 'USD');

    expect(() => krw.add(usd)).toThrow('화폐 단위가 일치하지 않습니다');
  });
});

