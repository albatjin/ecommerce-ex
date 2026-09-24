import { describe, it, expect } from 'vitest';
import { ValueObject } from './ValueObject';

interface MoneyProps {
  amount: number;
  currency: string;
}

class Money extends ValueObject<MoneyProps> {
  get amount(): number {
    return this.props.amount;
  }

  get currency(): string {
    return this.props.currency;
  }
}

describe('ValueObject Base Class', () => {
  it('동일한 속성 값을 가진 두 값 객체는 equals()가 true여야 한다', () => {
    const money1 = new Money({ amount: 10000, currency: 'KRW' });
    const money2 = new Money({ amount: 10000, currency: 'KRW' });

    expect(money1.equals(money2)).toBe(true);
  });

  it('속성 값이 다르면 equals()가 false여야 한다', () => {
    const money1 = new Money({ amount: 10000, currency: 'KRW' });
    const money2 = new Money({ amount: 20000, currency: 'KRW' });

    expect(money1.equals(money2)).toBe(false);
  });

  it('값 객체는 불변(Immutable)이어야 한다', () => {
    const money = new Money({ amount: 10000, currency: 'KRW' });
    // @ts-expect-error - readonly 속성 쓰기 시도 방지 확인
    expect(() => { money.props.amount = 20000; }).toThrow();
  });

  it('null 또는 undefined와 비교 시 false를 반환해야 한다', () => {
    const money = new Money({ amount: 10000, currency: 'KRW' });
    expect(money.equals(undefined)).toBe(false);
  });
});
