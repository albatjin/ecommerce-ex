import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAdminUsersAction,
  updateUserStatusAndGradeAction,
  grantUserPointsAction,
  issueUserCouponAction,
} from './user-admin.actions';

const mockGetUser = vi.fn();
vi.mock('@/core/infrastructure/supabase/server', () => ({
  getServerClient: vi.fn().mockImplementation(() => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

const mockFindMany = vi.fn();
const mockFindById = vi.fn();
const mockUpdate = vi.fn();

vi.mock('@/core/infrastructure/repositories/SupabaseUserRepository', () => ({
  SupabaseUserRepository: class {
    findMany = mockFindMany;
    findById = mockFindById;
    update = mockUpdate;
  },
}));

const mockRecordTransaction = vi.fn();
vi.mock('@/core/infrastructure/repositories/SupabasePointRepository', () => ({
  SupabasePointRepository: class {
    recordTransaction = mockRecordTransaction;
  },
}));

const mockIssueCoupon = vi.fn();
vi.mock('@/core/infrastructure/repositories/SupabaseCouponRepository', () => ({
  SupabaseCouponRepository: class {
    issueCoupon = mockIssueCoupon;
  },
}));

describe('user-admin.actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'admin-1',
          email: 'albat77@nate.com',
          user_metadata: { role: 'admin' },
        },
      },
    });
  });

  it('관리자가 회원 목록을 성공적으로 조회한다', async () => {
    const { User } = await import('@/core/domain/user/User');
    const user = User.create({
      customerNumber: 'CUST-001',
      email: 'user1@example.com',
      name: '홍길동',
      role: 'customer',
      membershipGrade: 'BRONZE',
      status: 'ACTIVE',
      smsConsent: false,
      emailConsent: false,
      appPushConsent: false,
    }, 'user-1').getValue();

    mockFindMany.mockResolvedValueOnce({
      users: [user],
      totalCount: 1,
    });

    const result = await getAdminUsersAction({ searchQuery: '홍길동' });

    expect(result.success).toBe(true);
    expect(result.data?.totalCount).toBe(1);
    expect(result.data?.users[0].name).toBe('홍길동');
  });

  it('관리자가 회원의 상태 및 등급을 변경한다', async () => {
    const { User } = await import('@/core/domain/user/User');
    const user = User.create({
      customerNumber: 'CUST-001',
      email: 'user1@example.com',
      name: '홍길동',
      role: 'customer',
      membershipGrade: 'BRONZE',
      status: 'ACTIVE',
      smsConsent: false,
      emailConsent: false,
      appPushConsent: false,
    }, 'user-1').getValue();

    mockFindById.mockResolvedValueOnce(user);

    const result = await updateUserStatusAndGradeAction({
      userId: 'user-1',
      status: 'DORMANT',
      membershipGrade: 'GOLD',
    });

    expect(result.success).toBe(true);
    expect(result.data?.status).toBe('DORMANT');
    expect(result.data?.membershipGrade).toBe('GOLD');
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  it('관리자가 회원에게 적립금을 지급한다', async () => {
    const { User } = await import('@/core/domain/user/User');
    const user = User.create({
      customerNumber: 'CUST-001',
      email: 'user1@example.com',
      name: '홍길동',
      role: 'customer',
      membershipGrade: 'BRONZE',
      status: 'ACTIVE',
      rewardPoints: 1000,
      smsConsent: false,
      emailConsent: false,
      appPushConsent: false,
    }, 'user-1').getValue();

    mockFindById.mockResolvedValueOnce(user);

    const result = await grantUserPointsAction({
      userId: 'user-1',
      amount: 2000,
      description: '우수회원 보너스',
    });

    expect(result.success).toBe(true);
    expect(result.data?.newBalance).toBe(3000);
    expect(mockRecordTransaction).toHaveBeenCalledTimes(1);
  });

  it('관리자가 회원에게 쿠폰을 발급한다', async () => {
    const { User } = await import('@/core/domain/user/User');
    const user = User.create({
      customerNumber: 'CUST-001',
      email: 'user1@example.com',
      name: '홍길동',
      role: 'customer',
      membershipGrade: 'BRONZE',
      status: 'ACTIVE',
      smsConsent: false,
      emailConsent: false,
      appPushConsent: false,
    }, 'user-1').getValue();

    mockFindById.mockResolvedValueOnce(user);

    const result = await issueUserCouponAction({
      userId: 'user-1',
      name: '감사 쿠폰 5,000원',
      discountAmount: 5000,
      minOrderAmount: 30000,
      validDays: 14,
    });

    expect(result.success).toBe(true);
    expect(result.data?.name).toBe('감사 쿠폰 5,000원');
    expect(mockIssueCoupon).toHaveBeenCalledTimes(1);
  });

  it('비관리자 사용자가 요청 시 에러를 반환한다', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: {
        user: {
          id: 'user-normal',
          email: 'customer@example.com',
          user_metadata: { role: 'customer' },
        },
      },
    });

    const result = await getAdminUsersAction();

    expect(result.success).toBe(false);
    expect(result.error).toContain('관리자 권한');
  });
});
