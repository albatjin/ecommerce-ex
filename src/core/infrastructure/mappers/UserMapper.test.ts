import { describe, it, expect } from 'vitest';
import { UserMapper } from './UserMapper';
import { User } from '@/core/domain/user/User';
import type { Database } from '@/shared/types/database.types';

type UserRow = Database['public']['Tables']['users']['Row'];

describe('UserMapper', () => {
  const sampleRow: UserRow = {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    customer_number: 'CUST-88391',
    email: 'mapper@example.com',
    name: '김테스트',
    phone: '010-9999-8888',
    role: 'customer',
    avatar_url: 'https://example.com/avatar.jpg',
    membership_grade: 'SILVER',
    status: 'ACTIVE',
    total_spent: 150000,
    total_orders: 2,
    reward_points: 3000,
    coupons_count: 1,
    personal_customs_code: 'P123456789012',
    gender: 'MALE',
    birth_year: 1995,
    sms_consent: true,
    email_consent: true,
    app_push_consent: false,
    default_address: '서울시 서초구 서초대로',
    default_zipcode: '06500',
    last_visit_at: '2026-09-24T00:00:00.000Z',
    created_at: '2026-09-01T00:00:00.000Z',
    updated_at: '2026-09-20T00:00:00.000Z',
  };

  it('toDomain: DB Row를 Domain User 엔티티로 정확히 변환한다', () => {
    const user = UserMapper.toDomain(sampleRow);

    expect(user.id).toBe(sampleRow.id);
    expect(user.customerNumber).toBe('CUST-88391');
    expect(user.email).toBe('mapper@example.com');
    expect(user.name).toBe('김테스트');
    expect(user.membershipGrade).toBe('SILVER');
    expect(user.totalSpent).toBe(150000);
    expect(user.rewardPoints).toBe(3000);
    expect(user.smsConsent).toBe(true);
    expect(user.appPushConsent).toBe(false);
  });

  it('toPersistence: Domain User 엔티티를 DB Insert 데이터로 정확히 변환한다', () => {
    const user = UserMapper.toDomain(sampleRow);
    const persistence = UserMapper.toPersistence(user);

    expect(persistence.id).toBe(sampleRow.id);
    expect(persistence.customer_number).toBe(sampleRow.customer_number);
    expect(persistence.email).toBe(sampleRow.email);
    expect(persistence.name).toBe(sampleRow.name);
    expect(persistence.total_spent).toBe(150000);
    expect(persistence.membership_grade).toBe('SILVER');
  });

  it('toUpdatePersistence: Domain User 엔티티를 DB Update 데이터로 정확히 변환한다', () => {
    const user = UserMapper.toDomain(sampleRow);
    user.updateProfile({ name: '김수정' });

    const updateData = UserMapper.toUpdatePersistence(user);

    expect(updateData.name).toBe('김수정');
    expect(updateData.customer_number).toBe('CUST-88391');
    expect(updateData.email).toBe('mapper@example.com');
    // Update 데이터에는 id가 포함되지 않아야 함
    expect('id' in updateData).toBe(false);
  });
});

