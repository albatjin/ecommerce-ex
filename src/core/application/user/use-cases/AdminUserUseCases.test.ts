import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetAdminUsersUseCase } from './GetAdminUsersUseCase';
import { UpdateUserStatusAndGradeUseCase } from './UpdateUserStatusAndGradeUseCase';
import { GrantUserPointsUseCase } from './GrantUserPointsUseCase';
import { IssueUserCouponUseCase } from './IssueUserCouponUseCase';
import { User } from '@/core/domain/user/User';
import type { IUserRepository } from '@/core/domain/user/IUserRepository';
import type { IPointRepository } from '@/core/domain/promotion/repositories/IPointRepository';
import type { ICouponRepository } from '@/core/domain/promotion/repositories/ICouponRepository';

function createSampleUser(id = 'user-1', name = '홍길동', email = 'hong@example.com') {
  return User.create(
    {
      customerNumber: 'CUST-00001',
      email,
      name,
      phone: '010-1234-5678',
      role: 'customer',
      membershipGrade: 'BRONZE',
      status: 'ACTIVE',
      totalSpent: 50000,
      totalOrders: 2,
      rewardPoints: 1000,
      couponsCount: 1,
      smsConsent: true,
      emailConsent: true,
      appPushConsent: false,
    },
    id
  ).getValue();
}

describe('Admin User Use Cases', () => {
  let mockUserRepo: IUserRepository;
  let mockPointRepo: IPointRepository;
  let mockCouponRepo: ICouponRepository;

  beforeEach(() => {
    mockUserRepo = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      findByCustomerNumber: vi.fn(),
      findMany: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    mockPointRepo = {
      findByCustomerId: vi.fn(),
      getCurrentBalance: vi.fn(),
      recordTransaction: vi.fn(),
    };

    mockCouponRepo = {
      findAvailableByCustomerId: vi.fn(),
      findAllByCustomerId: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(),
      issueCoupon: vi.fn(),
    };
  });

  describe('GetAdminUsersUseCase', () => {
    it('회원 목록과 총 카운트를 정상적으로 조회한다', async () => {
      const user = createSampleUser();
      vi.mocked(mockUserRepo.findMany).mockResolvedValueOnce({
        users: [user],
        totalCount: 1,
      });

      const useCase = new GetAdminUsersUseCase(mockUserRepo);
      const result = await useCase.execute({ searchQuery: '홍길동' });

      expect(result.isSuccess).toBe(true);
      const data = result.getValue();
      expect(data.totalCount).toBe(1);
      expect(data.users[0].name).toBe('홍길동');
      expect(data.users[0].email).toBe('hong@example.com');
      expect(data.users[0].membershipGrade).toBe('BRONZE');
    });
  });

  describe('UpdateUserStatusAndGradeUseCase', () => {
    it('회원의 상태, 등급 및 역할을 정상적으로 수정한다', async () => {
      const user = createSampleUser();
      vi.mocked(mockUserRepo.findById).mockResolvedValueOnce(user);

      const useCase = new UpdateUserStatusAndGradeUseCase(mockUserRepo);
      const result = await useCase.execute({
        userId: 'user-1',
        status: 'DORMANT',
        membershipGrade: 'VIP',
        role: 'manager',
      });

      expect(result.isSuccess).toBe(true);
      const updated = result.getValue();
      expect(updated.status).toBe('DORMANT');
      expect(updated.membershipGrade).toBe('VIP');
      expect(updated.role).toBe('manager');
      expect(mockUserRepo.update).toHaveBeenCalledWith(user);
    });

    it('존재하지 않는 회원 ID인 경우 에러를 반환한다', async () => {
      vi.mocked(mockUserRepo.findById).mockResolvedValueOnce(null);

      const useCase = new UpdateUserStatusAndGradeUseCase(mockUserRepo);
      const result = await useCase.execute({
        userId: 'unknown',
        status: 'ACTIVE',
      });

      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('찾을 수 없습니다');
    });
  });

  describe('GrantUserPointsUseCase', () => {
    it('회원에게 포인트를 성공적으로 적립하고 거래 원장을 기록한다', async () => {
      const user = createSampleUser();
      vi.mocked(mockUserRepo.findById).mockResolvedValueOnce(user);

      const useCase = new GrantUserPointsUseCase(mockUserRepo, mockPointRepo);
      const result = await useCase.execute({
        userId: 'user-1',
        amount: 3000,
        description: '관리자 수동 지급 보너스',
      });

      expect(result.isSuccess).toBe(true);
      const data = result.getValue();
      expect(data.amount).toBe(3000);
      expect(data.newBalance).toBe(4000); // 1000 + 3000
      expect(mockUserRepo.update).toHaveBeenCalledWith(user);
      expect(mockPointRepo.recordTransaction).toHaveBeenCalledTimes(1);
    });

    it('0원 이하의 적립금 지급 요청 시 실패한다', async () => {
      const useCase = new GrantUserPointsUseCase(mockUserRepo, mockPointRepo);
      const result = await useCase.execute({
        userId: 'user-1',
        amount: -500,
        description: '잘못된 포인트',
      });

      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('0원보다 커야 합니다');
    });
  });

  describe('IssueUserCouponUseCase', () => {
    it('회원에게 할인 쿠폰을 정상적으로 발급한다', async () => {
      const user = createSampleUser();
      vi.mocked(mockUserRepo.findById).mockResolvedValueOnce(user);

      const useCase = new IssueUserCouponUseCase(mockUserRepo, mockCouponRepo);
      const result = await useCase.execute({
        userId: 'user-1',
        name: '감사 10% 할인 쿠폰',
        discountRate: 10,
        minOrderAmount: 20000,
        validDays: 14,
      });

      expect(result.isSuccess).toBe(true);
      const data = result.getValue();
      expect(data.name).toBe('감사 10% 할인 쿠폰');
      expect(data.discountSummary).toBe('10% 할인');
      expect(mockCouponRepo.issueCoupon).toHaveBeenCalledTimes(1);
    });

    it('할인 금액이나 할인율이 모두 없으면 에러를 반환한다', async () => {
      const useCase = new IssueUserCouponUseCase(mockUserRepo, mockCouponRepo);
      const result = await useCase.execute({
        userId: 'user-1',
        name: '빈 할인 쿠폰',
      });

      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('하나를 지정해야 합니다');
    });
  });
});
