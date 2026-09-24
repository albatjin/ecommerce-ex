import { describe, it, expect, vi } from 'vitest';
import { UpdateProfileUseCase } from './UpdateProfileUseCase';
import { User } from '@/core/domain/user/User';
import type { IUserRepository } from '@/core/domain/user/IUserRepository';

describe('UpdateProfileUseCase', () => {
  const existingUser = User.create({
    customerNumber: 'CUST-99999',
    email: 'profile@example.com',
    name: '기존이름',
    phone: '010-1111-2222',
    role: 'customer',
    rewardPoints: 1000,
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

  it('회원이 존재하지 않으면 NotFoundError(404)를 반환한다', async () => {
    vi.mocked(mockUserRepo.findById).mockResolvedValueOnce(null);

    const useCase = new UpdateProfileUseCase(mockUserRepo);
    const result = await useCase.execute({
      userId: 'non-existent-user-id',
      name: '새이름',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError().code).toBe('NOT_FOUND');
    expect(result.getError().statusCode).toBe(404);
  });

  it('정상적인 프로필 데이터를 전달하면 엔티티를 수정하고 update를 호출한다', async () => {
    vi.mocked(mockUserRepo.findById).mockResolvedValueOnce(existingUser);

    const useCase = new UpdateProfileUseCase(mockUserRepo);
    const result = await useCase.execute({
      userId: existingUser.id,
      name: '새이름',
      phone: '010-9999-8888',
      personalCustomsCode: 'P123456789012',
      defaultAddress: '서울시 강남구 테헤란로',
      defaultZipcode: '06164',
      smsConsent: true,
      emailConsent: true,
    });

    expect(result.isSuccess).toBe(true);
    const updated = result.getValue();
    expect(updated.name).toBe('새이름');
    expect(updated.phone).toBe('010-9999-8888');
    expect(updated.personalCustomsCode).toBe('P123456789012');
    expect(updated.smsConsent).toBe(true);
    expect(mockUserRepo.update).toHaveBeenCalledWith(updated);
  });
});

