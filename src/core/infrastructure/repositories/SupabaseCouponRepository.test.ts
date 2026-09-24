import { describe, it, expect, vi } from 'vitest';
import { SupabaseCouponRepository } from './SupabaseCouponRepository';
import { CustomerCoupon } from '@/core/domain/promotion/entities/CustomerCoupon';
import type { Database } from '@/shared/types/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';

type CustomerCouponRow = Database['public']['Tables']['customer_coupons']['Row'];

describe('SupabaseCouponRepository', () => {
  const sampleCouponRow: CustomerCouponRow = {
    id: 'coupon-1',
    customer_id: 'user-1',
    name: '10,000원 주말 특가 쿠폰',
    discount_amount: 10000,
    discount_rate: null,
    min_order_amount: 50000,
    is_used: false,
    expires_at: '2026-12-31T23:59:59.000Z',
    created_at: '2026-01-01T00:00:00.000Z',
  };

  it('findAvailableByCustomerId: 사용 가능한 쿠폰 목록을 반환한다', async () => {
    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gt: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [sampleCouponRow], error: null }),
              }),
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient<Database>;

    const repo = new SupabaseCouponRepository(mockClient);
    const coupons = await repo.findAvailableByCustomerId('user-1');

    expect(coupons).toHaveLength(1);
    expect(coupons[0].name).toBe('10,000원 주말 특가 쿠폰');
    expect(coupons[0].discountAmount).toBe(10000);
    expect(coupons[0].isUsed).toBe(false);
  });

  it('findById: 쿠폰 단건을 정상 조회한다', async () => {
    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: sampleCouponRow, error: null }),
          }),
        }),
      }),
    } as unknown as SupabaseClient<Database>;

    const repo = new SupabaseCouponRepository(mockClient);
    const coupon = await repo.findById('coupon-1');

    expect(coupon).not.toBeNull();
    expect(coupon?.id).toBe('coupon-1');
    expect(coupon?.customerId).toBe('user-1');
  });

  it('issueCoupon: 신규 쿠폰을 DB에 삽입한다', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    const mockClient = {
      from: vi.fn().mockReturnValue({
        insert: insertMock,
      }),
    } as unknown as SupabaseClient<Database>;

    const repo = new SupabaseCouponRepository(mockClient);
    const newCoupon = CustomerCoupon.create({
      customerId: 'user-2',
      name: '웰컴 쿠폰',
      discountAmount: 5000,
      minOrderAmount: 20000,
      expiresAt: new Date('2026-12-31'),
    }).getValue();

    await repo.issueCoupon(newCoupon);

    expect(insertMock).toHaveBeenCalledTimes(1);
  });
});

