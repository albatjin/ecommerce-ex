'use server';

import { revalidatePath } from 'next/cache';
import { SupabaseUserRepository } from '@/core/infrastructure/repositories/SupabaseUserRepository';
import { GetCurrentUserUseCase } from '@/core/application/auth';
import { UpdateProfileUseCase } from '@/core/application/user';
import type { UpdateProfileInputDTO } from '@/core/application/user/dto/user.dto';

export async function updateProfileAction(data: Omit<UpdateProfileInputDTO, 'userId'>) {
  const userRepository = new SupabaseUserRepository();
  const getCurrentUserUseCase = new GetCurrentUserUseCase(userRepository);

  const currentUser = await getCurrentUserUseCase.execute();
  if (!currentUser) {
    return {
      success: false,
      error: '로그인이 필요한 작업입니다.',
    };
  }

  const updateProfileUseCase = new UpdateProfileUseCase(userRepository);
  const result = await updateProfileUseCase.execute({
    ...data,
    userId: currentUser.id,
  });

  if (result.isFailure) {
    return {
      success: false,
      error: result.getError().message,
    };
  }

  revalidatePath('/my-page');
  return {
    success: true,
  };
}

