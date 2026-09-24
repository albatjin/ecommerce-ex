import { describe, it, expect, vi } from 'vitest';
import { SupabaseUserRepository } from './SupabaseUserRepository';
import { User } from '@/core/domain/user/User';
import type { Database } from '@/shared/types/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';

type UserRow = Database['public']['Tables']['users']['Row'];

describe('SupabaseUserRepository', () => {
  const sampleRow: UserRow = {
    id: '11111111-1111-1111-1111-111111111111',
    customer_number: 'CUST-00001',
    email: 'repo@example.com',
    name: '리포테스트',
    phone: null,
    role: 'customer',
    avatar_url: null,
    membership_grade: 'BRONZE',
    status: 'ACTIVE',
    total_spent: 0,
    total_orders: 0,
    reward_points: 0,
    coupons_count: 0,
    personal_customs_code: null,
    gender: null,
    birth_year: null,
    sms_consent: false,
    email_consent: false,
    app_push_consent: false,
    default_address: null,
    default_zipcode: null,
    last_visit_at: null,
    created_at: '2026-09-01T00:00:00.000Z',
    updated_at: '2026-09-01T00:00:00.000Z',
  };

  it('findById: 사용자 존재 시 User 엔티티를 반환한다', () => {
    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: sampleRow, error: null }),
          }),
        }),
      }),
    } as unknown as SupabaseClient<Database>;

    const repo = new SupabaseUserRepository(mockClient);
    return repo.findById(sampleRow.id).then((user) => {
      expect(user).not.toBeNull();
      expect(user?.id).toBe(sampleRow.id);
      expect(user?.email).toBe('repo@example.com');
    });
  });

  it('findById: 사용자 미존재 시 null을 반환한다', () => {
    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    } as unknown as SupabaseClient<Database>;

    const repo = new SupabaseUserRepository(mockClient);
    return repo.findById('non-existent-id').then((user) => {
      expect(user).toBeNull();
    });
  });

  it('findByEmail: 이메일로 사용자를 올바르게 조회한다', () => {
    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: sampleRow, error: null }),
          }),
        }),
      }),
    } as unknown as SupabaseClient<Database>;

    const repo = new SupabaseUserRepository(mockClient);
    return repo.findByEmail('repo@example.com').then((user) => {
      expect(user).not.toBeNull();
      expect(user?.email).toBe('repo@example.com');
    });
  });

  it('save: insert 쿼리를 올바른 데이터와 함께 호출한다', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    const mockClient = {
      from: vi.fn().mockReturnValue({
        insert: insertMock,
      }),
    } as unknown as SupabaseClient<Database>;

    const repo = new SupabaseUserRepository(mockClient);
    const user = User.create({
      customerNumber: 'CUST-00002',
      email: 'new@example.com',
      name: '새사용자',
      role: 'customer',
      rewardPoints: 0,
      couponsCount: 0,
      smsConsent: false,
      emailConsent: false,
      appPushConsent: false,
    }).getValue();

    await repo.save(user);
    expect(insertMock).toHaveBeenCalled();
  });

  it('delete: eq 조건을 통해 특정 id의 레코드를 삭제한다', async () => {
    const eqMock = vi.fn().mockResolvedValue({ error: null });
    const deleteMock = vi.fn().mockReturnValue({ eq: eqMock });
    const mockClient = {
      from: vi.fn().mockReturnValue({
        delete: deleteMock,
      }),
    } as unknown as SupabaseClient<Database>;

    const repo = new SupabaseUserRepository(mockClient);
    await repo.delete('target-user-id');

    expect(deleteMock).toHaveBeenCalled();
    expect(eqMock).toHaveBeenCalledWith('id', 'target-user-id');
  });
});

