'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { SupabaseUserRepository } from '@/core/infrastructure/repositories/SupabaseUserRepository';
import {
  SignUpUseCase,
  SignInUseCase,
  SignOutUseCase,
} from '@/core/application/auth';
import type { SignUpDTO, SignInDTO } from '@/core/application/auth/dto/auth.dto';

/**
 * 회원가입 Server Action
 */
export async function signUpAction(data: SignUpDTO) {
  const userRepository = new SupabaseUserRepository();
  const signUpUseCase = new SignUpUseCase(userRepository);

  const result = await signUpUseCase.execute(data);

  if (result.isFailure) {
    return {
      success: false,
      error: result.getError().message,
    };
  }

  revalidatePath('/', 'layout');
  return {
    success: true,
  };
}

/**
 * 로그인 Server Action
 */
export async function signInAction(data: SignInDTO, redirectTo = '/') {
  const userRepository = new SupabaseUserRepository();
  const signInUseCase = new SignInUseCase(userRepository);

  const result = await signInUseCase.execute(data);

  if (result.isFailure) {
    return {
      success: false,
      error: result.getError().message,
    };
  }

  revalidatePath('/', 'layout');
  redirect(redirectTo);
}

/**
 * 로그아웃 Server Action
 */
export async function signOutAction() {
  const signOutUseCase = new SignOutUseCase();
  await signOutUseCase.execute();

  revalidatePath('/', 'layout');
  redirect('/');
}

