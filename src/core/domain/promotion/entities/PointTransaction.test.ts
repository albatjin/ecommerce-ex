import { describe, it, expect } from 'vitest';
import { PointTransaction } from './PointTransaction';

describe('PointTransaction Entity', () => {
  it('createEarn: 신규 적립 거래를 정상 생성하고 잔액을 가산한다', () => {
    const result = PointTransaction.createEarn({
      customerId: 'user-1',
      amount: 3000,
      currentBalance: 5000,
      description: '신규 회원가입 웰컴 적립금',
    });

    expect(result.isSuccess).toBe(true);
    const tx = result.getValue();
    expect(tx.amount).toBe(3000);
    expect(tx.balanceAfter).toBe(8000);
    expect(tx.isEarn()).toBe(true);
    expect(tx.isSpend()).toBe(false);
  });

  it('createSpend: 사용(차감) 거래를 정상 생성하고 잔액을 차감한다', () => {
    const result = PointTransaction.createSpend({
      customerId: 'user-1',
      amount: 2000,
      currentBalance: 5000,
      description: '주문서 작성 시 적립금 사용',
      orderId: 'order-123',
    });

    expect(result.isSuccess).toBe(true);
    const tx = result.getValue();
    expect(tx.amount).toBe(-2000);
    expect(tx.balanceAfter).toBe(3000);
    expect(tx.isEarn()).toBe(false);
    expect(tx.isSpend()).toBe(true);
    expect(tx.orderId).toBe('order-123');
  });

  it('보유 포인트보다 많은 금액을 사용하려 하면 실패한다', () => {
    const result = PointTransaction.createSpend({
      customerId: 'user-1',
      amount: 10000,
      currentBalance: 3000,
      description: '초과 사용 시도',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError().message).toContain('부족하여');
  });

  it('0원 이하의 적립 또는 차감은 거부된다', () => {
    const zeroEarn = PointTransaction.createEarn({
      customerId: 'user-1',
      amount: 0,
      currentBalance: 1000,
      description: '0원 적립',
    });
    expect(zeroEarn.isFailure).toBe(true);

    const zeroSpend = PointTransaction.createSpend({
      customerId: 'user-1',
      amount: -500,
      currentBalance: 1000,
      description: '음수 차감',
    });
    expect(zeroSpend.isFailure).toBe(true);
  });
});
