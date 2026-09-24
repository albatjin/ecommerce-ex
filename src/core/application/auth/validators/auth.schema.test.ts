import { describe, it, expect } from 'vitest';
import { loginSchema, signUpSchema } from './auth.schema';

describe('Auth Validation Schemas (Zod)', () => {
  describe('loginSchema', () => {
    it('유효한 로그인 데이터를 통과시킨다', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('이메일 형식이 잘못되면 에러를 반환한다', () => {
      const result = loginSchema.safeParse({
        email: 'invalid-email',
        password: 'password123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('올바른 이메일 주소 형식');
      }
    });

    it('비밀번호가 6자 미만이면 에러를 반환한다', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: '123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('최소 6자 이상');
      }
    });
  });

  describe('signUpSchema', () => {
    const validSignUpData = {
      email: 'newuser@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      name: '홍길동',
      phone: '010-1234-5678',
      termsConsent: true,
      smsConsent: false,
      emailConsent: true,
    };

    it('유효한 회원가입 데이터를 통과시킨다', () => {
      const result = signUpSchema.safeParse(validSignUpData);
      expect(result.success).toBe(true);
    });

    it('비밀번호와 비밀번호 확인이 일치하지 않으면 에러를 반환한다', () => {
      const result = signUpSchema.safeParse({
        ...validSignUpData,
        confirmPassword: 'different-password',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('비밀번호가 일치하지 않습니다.');
      }
    });

    it('필수 약관(termsConsent)에 동의하지 않으면 에러를 반환한다', () => {
      const result = signUpSchema.safeParse({
        ...validSignUpData,
        termsConsent: false,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('이용약관 및 개인정보 수집에 동의해야 합니다');
      }
    });

    it('이름이 2자 미만이면 에러를 반환한다', () => {
      const result = signUpSchema.safeParse({
        ...validSignUpData,
        name: '김',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('최소 2자 이상');
      }
    });
  });
});

