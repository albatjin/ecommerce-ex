import { describe, it, expect } from 'vitest';
import { User } from './User';

describe('User Domain Entity', () => {
  const validProps = {
    customerNumber: 'CUST-10001',
    email: 'user@example.com',
    name: '홍길동',
    role: 'customer' as const,
    rewardPoints: 1000,
    couponsCount: 2,
    smsConsent: false,
    emailConsent: true,
    appPushConsent: false,
  };

  describe('User.create', () => {
    it('유효한 속성으로 User 엔티티를 성공적으로 생성한다', () => {
      const result = User.create(validProps);

      expect(result.isSuccess).toBe(true);
      const user = result.getValue();
      expect(user.customerNumber).toBe('CUST-10001');
      expect(user.email).toBe('user@example.com');
      expect(user.name).toBe('홍길동');
      expect(user.membershipGrade).toBe('BRONZE');
      expect(user.status).toBe('ACTIVE');
      expect(user.totalSpent).toBe(0);
      expect(user.totalOrders).toBe(0);
      expect(user.isAdmin()).toBe(false);
    });

    it('이메일에 @가 없으면 생성을 거부한다', () => {
      const result = User.create({
        ...validProps,
        email: 'invalid-email',
      });

      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('유효한 이메일 주소');
    });

    it('이름이 공백이면 생성을 거부한다', () => {
      const result = User.create({
        ...validProps,
        name: '   ',
      });

      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('회원 이름은 필수');
    });
  });

  describe('프로필 및 마케팅 동의 수정', () => {
    it('updateProfile로 연락처 및 주소를 수정할 수 있다', () => {
      const user = User.create(validProps).getValue();

      user.updateProfile({
        name: '김철수',
        phone: '010-1234-5678',
        defaultAddress: '서울시 강남구 테헤란로',
        defaultZipcode: '06164',
      });

      expect(user.name).toBe('김철수');
      expect(user.phone).toBe('010-1234-5678');
      expect(user.defaultAddress).toBe('서울시 강남구 테헤란로');
      expect(user.defaultZipcode).toBe('06164');
    });

    it('이름을 빈 문자열로 수정하려 하면 예외를 던진다', () => {
      const user = User.create(validProps).getValue();
      expect(() => user.updateProfile({ name: '' })).toThrow('회원 이름은 비어있을 수 없습니다.');
    });

    it('updateMarketingConsent로 마케팅 동의를 갱신할 수 있다', () => {
      const user = User.create(validProps).getValue();

      user.updateMarketingConsent({
        smsConsent: true,
        emailConsent: true,
        appPushConsent: true,
      });

      expect(user.smsConsent).toBe(true);
      expect(user.appPushConsent).toBe(true);
    });
  });

  describe('적립금 비즈니스 규칙', () => {
    it('addRewardPoints로 포인트를 적립할 수 있다', () => {
      const user = User.create(validProps).getValue();
      user.addRewardPoints(500);

      expect(user.rewardPoints).toBe(1500);
    });

    it('0 이하의 포인트 적립 시 예외를 던진다', () => {
      const user = User.create(validProps).getValue();
      expect(() => user.addRewardPoints(0)).toThrow('적립할 포인트는 0보다 커야 합니다.');
    });

    it('useRewardPoints로 보유 한도 내 포인트를 차감할 수 있다', () => {
      const user = User.create(validProps).getValue();
      user.useRewardPoints(600);

      expect(user.rewardPoints).toBe(400);
    });

    it('보유 포인트보다 큰 금액 차감 시 DomainError를 던진다', () => {
      const user = User.create(validProps).getValue();
      expect(() => user.useRewardPoints(2000)).toThrow('보유 포인트(1000P)가 부족하여');
    });
  });

  describe('회원 등급 산정 및 결제 실적 누적', () => {
    it('결제 완료 시 누적 금액과 주문수가 증가하고 등급이 자동 승급된다', () => {
      const user = User.create(validProps).getValue();
      expect(user.membershipGrade).toBe('BRONZE');

      // 15만원 결제 -> SILVER 승급 (10만 이상)
      user.recordOrderPayment(150000);
      expect(user.totalSpent).toBe(150000);
      expect(user.totalOrders).toBe(1);
      expect(user.membershipGrade).toBe('SILVER');

      // 추가 20만원 결제 (누적 35만원) -> GOLD 승급 (30만 이상)
      user.recordOrderPayment(200000);
      expect(user.totalSpent).toBe(350000);
      expect(user.totalOrders).toBe(2);
      expect(user.membershipGrade).toBe('GOLD');

      // 추가 70만원 결제 (누적 105만원) -> VIP 승급 (100만 이상)
      user.recordOrderPayment(700000);
      expect(user.totalSpent).toBe(1050000);
      expect(user.totalOrders).toBe(3);
      expect(user.membershipGrade).toBe('VIP');

      // 추가 200만원 결제 (누적 305만원) -> VVIP 승급 (300만 이상)
      user.recordOrderPayment(2000000);
      expect(user.totalSpent).toBe(3050000);
      expect(user.totalOrders).toBe(4);
      expect(user.membershipGrade).toBe('VVIP');
    });
  });

  describe('관리자 권한 판별', () => {
    it('admin, super_admin, manager, staff 역할은 isAdmin이 true이다', () => {
      const adminRoles = ['super_admin', 'admin', 'manager', 'staff'] as const;

      for (const role of adminRoles) {
        const user = User.create({ ...validProps, role }).getValue();
        expect(user.isAdmin()).toBe(true);
      }
    });

    it('customer 역할은 isAdmin이 false이다', () => {
      const user = User.create({ ...validProps, role: 'customer' }).getValue();
      expect(user.isAdmin()).toBe(false);
    });
  });
});

