import { describe, it, expect } from 'vitest';
import { CustomerCoupon } from './CustomerCoupon';

describe('CustomerCoupon Entity', () => {
  const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7일 후
  const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24); // 1일 전

  it('정액 할인 쿠폰을 정상 생성하고 할인 금액을 정확히 계산한다', () => {
    const coupon = CustomerCoupon.create({
      customerId: 'user-1',
      name: '5,000원 장바구니 할인쿠폰',
      discountAmount: 5000,
      minOrderAmount: 30000,
      expiresAt: futureDate,
    }).getValue();

    expect(coupon.name).toBe('5,000원 장바구니 할인쿠폰');
    expect(coupon.isUsed).toBe(false);
    expect(coupon.isExpired()).toBe(false);

    // 최소 주문 금액(30,000원) 미만 시 사용 불가 및 할인 0원
    expect(coupon.isUsable(25000)).toBe(false);
    expect(coupon.calculateDiscount(25000).amount).toBe(0);

    // 최소 주문 금액 이상 시 5,000원 전액 할인
    expect(coupon.isUsable(40000)).toBe(true);
    expect(coupon.calculateDiscount(40000).amount).toBe(5000);
  });

  it('정률 할인 쿠폰을 정상 생성하고 비율에 맞게 할인 금액을 계산한다', () => {
    const coupon = CustomerCoupon.create({
      customerId: 'user-1',
      name: '10% 감사 할인쿠폰',
      discountRate: 10,
      minOrderAmount: 20000,
      expiresAt: futureDate,
    }).getValue();

    expect(coupon.discountRate).toBe(10);
    // 50,000원의 10% = 5,000원
    expect(coupon.calculateDiscount(50000).amount).toBe(5000);
    // 85,000원의 10% = 8,500원
    expect(coupon.calculateDiscount(85000).amount).toBe(8500);
  });

  it('만료된 쿠폰은 isExpired()가 true이며 사용이 불가능하다', () => {
    const coupon = CustomerCoupon.create({
      customerId: 'user-1',
      name: '만료된 쿠폰',
      discountAmount: 3000,
      minOrderAmount: 10000,
      expiresAt: pastDate,
    }).getValue();

    expect(coupon.isExpired()).toBe(true);
    expect(coupon.isUsable(50000)).toBe(false);
    expect(coupon.calculateDiscount(50000).amount).toBe(0);

    const useResult = coupon.markAsUsed(50000);
    expect(useResult.isFailure).toBe(true);
    expect(useResult.getError().message).toContain('만료된 쿠폰');
  });

  it('markAsUsed 및 restore: 쿠폰 사용 및 주문 취소 시 정상 복원된다', () => {
    const coupon = CustomerCoupon.create({
      customerId: 'user-1',
      name: '사용 테스트 쿠폰',
      discountAmount: 5000,
      minOrderAmount: 20000,
      expiresAt: futureDate,
    }).getValue();

    // 1. 정상 사용
    const useResult = coupon.markAsUsed(30000);
    expect(useResult.isSuccess).toBe(true);
    expect(coupon.isUsed).toBe(true);
    expect(coupon.isUsable(30000)).toBe(false);

    // 2. 이미 사용된 쿠폰 재사용 시도 시 에러
    const reuseResult = coupon.markAsUsed(30000);
    expect(reuseResult.isFailure).toBe(true);
    expect(reuseResult.getError().message).toContain('이미 사용된 쿠폰');

    // 3. 복원
    coupon.restore();
    expect(coupon.isUsed).toBe(false);
    expect(coupon.isUsable(30000)).toBe(true);
  });
});
