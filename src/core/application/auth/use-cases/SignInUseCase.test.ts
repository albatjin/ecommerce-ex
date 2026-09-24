import { describe, it, expect, vi } from 'vitest';
import { SignInUseCase } from './SignInUseCase';
import { User } from '@/core/domain/user/User';
import type { IUserRepository } from '@/core/domain/user/IUserRepository';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/shared/types/database.types';

describe('SignInUseCase', () => {
  const activeUser = User.create({
    customerNumber: 'CUST-11111',
    email: 'login@example.com',
    name: '로그인유저',
    role: 'customer',
    rewardPoints: 1000,
    couponsCount: 0,
    smsConsent: false,
    emailConsent: false,
    appPushConsent: false,
  }).getValue();

  const withdrawnUser = User.create({
    customerNumber: 'CUST-22222',
    email: 'withdrawn@example.com',
    name: '탈퇴유저',
    role: 'customer',
    rewardPoints: 0,
    couponsCount: 0,
    status: 'WITHDRAWN',
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

  it('비밀번호 불일치 시 UnauthorizedError(401)를 반환한다', async () => {
    const mockSupabase = {
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Invalid login credentials' },
        }),
      },
    } as unknown as SupabaseClient<Database>;

    const useCase = new SignInUseCase(mockUserRepo, mockSupabase);
    const result = await useCase.execute({
      email: 'login@example.com',
      password: 'wrongpassword',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError().code).toBe('UNAUTHORIZED');
    expect(result.getError().statusCode).toBe(401);
  });

  it('탈퇴한 회원(WITHDRAWN)은 로그인을 차단하고 세션을 종료한다', async () => {
    const signOutMock = vi.fn().mockResolvedValue({ error: null });
    const mockSupabase = {
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { user: { id: withdrawnUser.id } },
          error: null,
        }),
        signOut: signOutMock,
      },
    } as unknown as SupabaseClient<Database>;

    vi.mocked(mockUserRepo.findById).mockResolvedValueOnce(withdrawnUser);

    const useCase = new SignInUseCase(mockUserRepo, mockSupabase);
    const result = await useCase.execute({
      email: 'withdrawn@example.com',
      password: 'password123',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError().message).toContain('탈퇴 처리된 계정');
    expect(signOutMock).toHaveBeenCalled();
  });

  it('정상 자격 증명 시 User 엔티티를 반환한다', async () => {
    const mockSupabase = {
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { user: { id: activeUser.id } },
          error: null,
        }),
      },
    } as unknown as SupabaseClient<Database>;

    vi.mocked(mockUserRepo.findById).mockResolvedValueOnce(activeUser);

    const useCase = new SignInUseCase(mockUserRepo, mockSupabase);
    const result = await useCase.execute({
      email: 'login@example.com',
      password: 'correctpassword',
    });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().email).toBe('login@example.com');
  });
});

