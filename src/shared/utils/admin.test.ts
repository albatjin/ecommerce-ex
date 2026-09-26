import { describe, it, expect } from 'vitest';
import { isEmailAdmin, checkIsAdmin } from './admin';

describe('Admin Utility Helper', () => {
  describe('isEmailAdmin', () => {
    it('albat77@nate.com은 관리자로 판별되어야 한다', () => {
      expect(isEmailAdmin('albat77@nate.com')).toBe(true);
      expect(isEmailAdmin('ALBAT77@NATE.COM')).toBe(true);
    });

    it('지정된 관리자 및 내부 시스템 계정은 관리자로 판별되어야 한다', () => {
      expect(isEmailAdmin('admin@commercehub.internal')).toBe(true);
      expect(isEmailAdmin('admin@example.com')).toBe(true);
    });

    it('albat77@naver.com 등 일반 고객 이메일은 관리자가 아니어야 한다', () => {
      expect(isEmailAdmin('albat77@naver.com')).toBe(false);
      expect(isEmailAdmin('albatjin@gmail.com')).toBe(false);
      expect(isEmailAdmin('superadmin@naver.com')).toBe(false);
      expect(isEmailAdmin('user@example.com')).toBe(false);
      expect(isEmailAdmin('customer123@daum.net')).toBe(false);
      expect(isEmailAdmin('')).toBe(false);
      expect(isEmailAdmin(null)).toBe(false);
      expect(isEmailAdmin(undefined)).toBe(false);
    });
  });

  describe('checkIsAdmin', () => {
    it('관리자 역할(admin, super_admin, manager, staff)이 있으면 이메일과 무관하게 관리자이다', () => {
      expect(checkIsAdmin({ role: 'admin', email: 'user@test.com' })).toBe(true);
      expect(checkIsAdmin({ role: 'super_admin' })).toBe(true);
      expect(checkIsAdmin({ role: 'manager' })).toBe(true);
      expect(checkIsAdmin({ role: 'staff' })).toBe(true);
    });

    it('역할이 customer라도 albat77@nate.com이면 관리자이다', () => {
      expect(checkIsAdmin({ role: 'customer', email: 'albat77@nate.com' })).toBe(true);
    });

    it('역할이 customer이고 albat77@naver.com 등 일반 이메일이면 관리자가 아니다', () => {
      expect(checkIsAdmin({ role: 'customer', email: 'albat77@naver.com' })).toBe(false);
      expect(checkIsAdmin({ role: 'customer', email: 'buyer@test.com' })).toBe(false);
    });
  });
});

