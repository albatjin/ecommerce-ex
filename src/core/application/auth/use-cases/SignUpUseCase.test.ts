import { describe, it, expect, vi } from 'vitest';
import { SignUpUseCase } from './SignUpUseCase';
import { User } from '@/core/domain/user/User';
import type { IUserRepository } from '@/core/domain/user/IUserRepository';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/shared/types/database.types';

describe('SignUpUseCase', () => {
  const mockUser = User.create({
    customerNumber: 'CUST-12345',
    email: 'existing@example.com',
    name: '기존회원',
    role: 'customer',
    rewardPoints: 3000,
    couponsCount: 0,
    smsConsent: false,
    emailConsent: false,
    appPushConsent: false,
  }).getValue();

  const mockUserRepo: IUserRepository = {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    findByCustomerNumber: vi.fn(),
    findMany: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  it('유효하지 않은 이메일은 검증 에러를 반환한다', async () => {
    const useCase = new SignUpUseCase(mockUserRepo);
    const result = await useCase.execute({
      email: 'not-an-email',
      password: 'password123',
      name: '홍길동',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError().code).toBe('VALIDATION_ERROR');
  });

  it('6자 미만의 비밀번호는 검증 에러를 반환한다', async () => {
    const useCase = new SignUpUseCase(mockUserRepo);
    const result = await useCase.execute({
      email: 'valid@example.com',
      password: '123',
      name: '홍길동',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError().message).toContain('최소 6자 이상');
  });

  it('이미 존재하는 이메일이면 ConflictError(409)를 반환한다', async () => {
    vi.mocked(mockUserRepo.findByEmail).mockResolvedValueOnce(mockUser);

    const useCase = new SignUpUseCase(mockUserRepo);
    const result = await useCase.execute({
      email: 'existing@example.com',
      password: 'password123',
      name: '홍길동',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError().code).toBe('CONFLICT');
    expect(result.getError().statusCode).toBe(409);
  });

  it('정상 회원가입 시 Supabase Auth 호출 후 User 엔티티를 반환한다', async () => {
    vi.mocked(mockUserRepo.findByEmail).mockResolvedValueOnce(null);
    vi.mocked(mockUserRepo.findById).mockResolvedValueOnce(mockUser);

    const mockSupabase = {
      auth: {
        signUp: vi.fn().mockResolvedValue({
          data: { user: { id: mockUser.id, email: 'new@example.com' } },
          error: null,
        }),
      },
    } as unknown as SupabaseClient<Database>;

    const useCase = new SignUpUseCase(mockUserRepo, mockSupabase);
    const result = await useCase.execute({
      email: 'new@example.com',
      password: 'password123',
      name: '신규회원',
      smsConsent: true,
      emailConsent: true,
    });

    expect(result.isSuccess).toBe(true);
    expect(mockSupabase.auth.signUp).toHaveBeenCalled();
  });
});

