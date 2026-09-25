'use server';

import { revalidatePath } from 'next/cache';
import { getServerClient } from '@/core/infrastructure/supabase/server';
import { SupabaseUserRepository } from '@/core/infrastructure/repositories/SupabaseUserRepository';
import { SupabasePointRepository } from '@/core/infrastructure/repositories/SupabasePointRepository';
import { SupabaseCouponRepository } from '@/core/infrastructure/repositories/SupabaseCouponRepository';
import {
  GetAdminUsersUseCase,
  UpdateUserStatusAndGradeUseCase,
  GrantUserPointsUseCase,
  IssueUserCouponUseCase,
  type GetAdminUsersInputDTO,
  type GetAdminUsersResultDTO,
  type UpdateUserStatusAndGradeInputDTO,
  type GrantRewardPointsInputDTO,
  type IssueManualCouponInputDTO,
  type AdminUserSummaryDTO,
} from '@/core/application/user';
import { checkIsAdmin } from '@/shared/utils/admin';

export interface AdminUserActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function verifyAdminAuth() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userRole = user?.user_metadata?.role || user?.app_metadata?.role;
  const isAdmin = checkIsAdmin({ role: userRole, email: user?.email });

  if (user && !isAdmin) {
    throw new Error('관리자 권한이 없습니다.');
  }

  return { supabase, user };
}

/**
 * 관리자 회원 목록 조회 Server Action
 */
export async function getAdminUsersAction(
  input: GetAdminUsersInputDTO = {}
): Promise<AdminUserActionResult<GetAdminUsersResultDTO>> {
  try {
    const { supabase } = await verifyAdminAuth();
    const userRepo = new SupabaseUserRepository(supabase);
    const useCase = new GetAdminUsersUseCase(userRepo);

    const result = await useCase.execute(input);

    if (result.isFailure) {
      return { success: false, error: result.getError().message };
    }

    return { success: true, data: result.getValue() };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '회원 목록을 불러오지 못했습니다.',
    };
  }
}

/**
 * 회원 상태, 등급 및 역할 변경 Server Action
 */
export async function updateUserStatusAndGradeAction(
  input: UpdateUserStatusAndGradeInputDTO
): Promise<AdminUserActionResult<AdminUserSummaryDTO>> {
  try {
    const { supabase } = await verifyAdminAuth();
    const userRepo = new SupabaseUserRepository(supabase);
    const useCase = new UpdateUserStatusAndGradeUseCase(userRepo);

    const result = await useCase.execute(input);

    if (result.isFailure) {
      return { success: false, error: result.getError().message };
    }

    revalidatePath('/admin/users');
    return { success: true, data: result.getValue() };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '회원 정보 수정 중 오류가 발생했습니다.',
    };
  }
}

/**
 * 회원 적립금 수동 지급 Server Action
 */
export async function grantUserPointsAction(
  input: GrantRewardPointsInputDTO
): Promise<AdminUserActionResult<{ userId: string; amount: number; newBalance: number }>> {
  try {
    const { supabase } = await verifyAdminAuth();
    const userRepo = new SupabaseUserRepository(supabase);
    const pointRepo = new SupabasePointRepository(supabase);
    const useCase = new GrantUserPointsUseCase(userRepo, pointRepo);

    const result = await useCase.execute(input);

    if (result.isFailure) {
      return { success: false, error: result.getError().message };
    }

    revalidatePath('/admin/users');
    return { success: true, data: result.getValue() };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '적립금 지급 처리 중 오류가 발생했습니다.',
    };
  }
}

/**
 * 회원 전용 쿠폰 수동 발급 Server Action
 */
export async function issueUserCouponAction(
  input: IssueManualCouponInputDTO
): Promise<AdminUserActionResult<{ couponId: string; userId: string; name: string; discountSummary: string }>> {
  try {
    const { supabase } = await verifyAdminAuth();
    const userRepo = new SupabaseUserRepository(supabase);
    const couponRepo = new SupabaseCouponRepository(supabase);
    const useCase = new IssueUserCouponUseCase(userRepo, couponRepo);

    const result = await useCase.execute(input);

    if (result.isFailure) {
      return { success: false, error: result.getError().message };
    }

    revalidatePath('/admin/users');
    return { success: true, data: result.getValue() };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '쿠폰 발급 처리 중 오류가 발생했습니다.',
    };
  }
}
