import { describe, it, expect } from 'vitest';
import { determineRouteAccess } from './route-guard';

describe('Route Guard Authorization & Session Policy', () => {
  describe('공개 라우트 (Public Routes)', () => {
    it('홈, 상품 목록, 카테고리 등은 비로그인 사용자에게도 허용된다', () => {
      expect(determineRouteAccess({ pathname: '/', isAuthenticated: false }).allowed).toBe(true);
      expect(determineRouteAccess({ pathname: '/products', isAuthenticated: false }).allowed).toBe(true);
      expect(determineRouteAccess({ pathname: '/categories/electronics', isAuthenticated: false }).allowed).toBe(true);
    });

    it('홈, 상품 목록 등은 로그인 사용자에게도 정상 허용된다', () => {
      expect(determineRouteAccess({ pathname: '/', isAuthenticated: true, userRole: 'customer' }).allowed).toBe(true);
      expect(determineRouteAccess({ pathname: '/products/prod-123', isAuthenticated: true, userRole: 'customer' }).allowed).toBe(true);
    });
  });

  describe('회원 보호 라우트 (/my-page, /checkout 등)', () => {
    it('비로그인 사용자가 /my-page 접근 시 로그인 페이지로 리다이렉트한다', () => {
      const result = determineRouteAccess({
        pathname: '/my-page',
        isAuthenticated: false,
      });

      expect(result.allowed).toBe(false);
      expect(result.redirectUrl).toBe('/login?redirect=%2Fmy-page');
    });

    it('쿼리스트링이 있는 보호 라우트 접근 시 쿼리까지 인코딩하여 리다이렉트한다', () => {
      const result = determineRouteAccess({
        pathname: '/checkout',
        searchParams: 'coupon=WELCOME&step=2',
        isAuthenticated: false,
      });

      expect(result.allowed).toBe(false);
      expect(result.redirectUrl).toBe('/login?redirect=%2Fcheckout%3Fcoupon%3DWELCOME%26step%3D2');
    });

    it('로그인한 사용자는 보호 라우트에 정상 접근할 수 있다', () => {
      const result = determineRouteAccess({
        pathname: '/my-page/orders',
        isAuthenticated: true,
        userRole: 'customer',
      });

      expect(result.allowed).toBe(true);
    });
  });

  describe('관리자 라우트 (/admin)', () => {
    it('비로그인 사용자가 /admin 접근 시 로그인 페이지로 리다이렉트한다', () => {
      const result = determineRouteAccess({
        pathname: '/admin/products',
        isAuthenticated: false,
      });

      expect(result.allowed).toBe(false);
      expect(result.redirectUrl).toBe('/login?redirect=%2Fadmin%2Fproducts');
    });

    it('일반 고객(customer)이 /admin 접근 시 홈으로 리다이렉트(forbidden)한다', () => {
      const result = determineRouteAccess({
        pathname: '/admin/dashboard',
        isAuthenticated: true,
        userRole: 'customer',
      });

      expect(result.allowed).toBe(false);
      expect(result.redirectUrl).toBe('/?error=forbidden');
    });

    it('관리자 권한(admin, super_admin, manager, staff)은 /admin 접근이 허용된다', () => {
      const roles = ['super_admin', 'admin', 'manager', 'staff'] as const;

      for (const role of roles) {
        const result = determineRouteAccess({
          pathname: '/admin/settings',
          isAuthenticated: true,
          userRole: role,
        });
        expect(result.allowed).toBe(true);
      }
    });
  });

  describe('인증 전용 라우트 (/login, /signup)', () => {
    it('비로그인 사용자는 /login, /signup에 접근할 수 있다', () => {
      expect(determineRouteAccess({ pathname: '/login', isAuthenticated: false }).allowed).toBe(true);
      expect(determineRouteAccess({ pathname: '/signup', isAuthenticated: false }).allowed).toBe(true);
    });

    it('이미 로그인한 사용자가 /login에 접근하면 홈(/)으로 리다이렉트한다', () => {
      const result = determineRouteAccess({
        pathname: '/login',
        isAuthenticated: true,
        userRole: 'customer',
      });

      expect(result.allowed).toBe(false);
      expect(result.redirectUrl).toBe('/');
    });
  });
});

