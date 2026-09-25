'use server';

import { revalidatePath } from 'next/cache';
import { getServerClient } from '@/core/infrastructure/supabase/server';
import { SupabaseCategoryRepository } from '@/core/infrastructure/repositories/SupabaseCategoryRepository';
import {
  GetAdminCategoryTreeUseCase,
  CreateCategoryUseCase,
  UpdateCategoryUseCase,
  DeleteCategoryUseCase,
  ReorderCategoriesUseCase,
  type AdminCategoryNodeDTO,
  type CreateCategoryInputDTO,
  type UpdateCategoryInputDTO,
  type ReorderCategoryItemDTO,
} from '@/core/application/catalog';
import { checkIsAdmin } from '@/shared/utils/admin';

export interface AdminCategoryActionResult<T> {
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

function revalidateCategoryPaths() {
  revalidatePath('/admin/categories');
  revalidatePath('/');
  revalidatePath('/products');
}

/**
 * 관리자 카테고리 전체 트리 조회
 */
export async function getAdminCategoryTreeAction(): Promise<AdminCategoryActionResult<AdminCategoryNodeDTO[]>> {
  try {
    const { supabase } = await verifyAdminAuth();
    const repo = new SupabaseCategoryRepository(supabase);
    const useCase = new GetAdminCategoryTreeUseCase(repo);

    const result = await useCase.execute();

    if (result.isFailure) {
      return { success: false, error: result.getError().message };
    }

    return { success: true, data: result.getValue() };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '카테고리 트리를 불러오지 못했습니다.',
    };
  }
}

/**
 * 카테고리 등록
 */
export async function createCategoryAction(
  input: CreateCategoryInputDTO
): Promise<AdminCategoryActionResult<{ id: string; name: string }>> {
  try {
    const { supabase } = await verifyAdminAuth();
    const repo = new SupabaseCategoryRepository(supabase);
    const useCase = new CreateCategoryUseCase(repo);

    const result = await useCase.execute(input);

    if (result.isFailure) {
      return { success: false, error: result.getError().message };
    }

    const category = result.getValue();
    revalidateCategoryPaths();

    return {
      success: true,
      data: { id: category.id, name: category.name },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '카테고리 등록에 실패했습니다.',
    };
  }
}

/**
 * 카테고리 정보 수정
 */
export async function updateCategoryAction(
  input: UpdateCategoryInputDTO
): Promise<AdminCategoryActionResult<{ id: string; name: string }>> {
  try {
    const { supabase } = await verifyAdminAuth();
    const repo = new SupabaseCategoryRepository(supabase);
    const useCase = new UpdateCategoryUseCase(repo);

    const result = await useCase.execute(input);

    if (result.isFailure) {
      return { success: false, error: result.getError().message };
    }

    const category = result.getValue();
    revalidateCategoryPaths();

    return {
      success: true,
      data: { id: category.id, name: category.name },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '카테고리 수정에 실패했습니다.',
    };
  }
}

/**
 * 카테고리 노출 상태 토글 (활성/비활성)
 */
export async function toggleCategoryStatusAction(
  id: string,
  isActive: boolean
): Promise<AdminCategoryActionResult<void>> {
  try {
    const { supabase } = await verifyAdminAuth();
    const repo = new SupabaseCategoryRepository(supabase);
    const useCase = new UpdateCategoryUseCase(repo);

    const result = await useCase.execute({ id, isActive });

    if (result.isFailure) {
      return { success: false, error: result.getError().message };
    }

    revalidateCategoryPaths();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '카테고리 상태 변경에 실패했습니다.',
    };
  }
}

/**
 * 카테고리 삭제
 */
export async function deleteCategoryAction(
  id: string
): Promise<AdminCategoryActionResult<void>> {
  try {
    const { supabase } = await verifyAdminAuth();
    const repo = new SupabaseCategoryRepository(supabase);
    const useCase = new DeleteCategoryUseCase(repo);

    const result = await useCase.execute(id);

    if (result.isFailure) {
      return { success: false, error: result.getError().message };
    }

    revalidateCategoryPaths();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '카테고리 삭제에 실패했습니다.',
    };
  }
}

/**
 * 카테고리 순서 일괄 변경
 */
export async function reorderCategoriesAction(
  items: ReorderCategoryItemDTO[]
): Promise<AdminCategoryActionResult<void>> {
  try {
    const { supabase } = await verifyAdminAuth();
    const repo = new SupabaseCategoryRepository(supabase);
    const useCase = new ReorderCategoriesUseCase(repo);

    const result = await useCase.execute(items);

    if (result.isFailure) {
      return { success: false, error: result.getError().message };
    }

    revalidateCategoryPaths();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '카테고리 순서 변경에 실패했습니다.',
    };
  }
}
