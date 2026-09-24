'use server';

import { SupabaseCategoryRepository } from '@/core/infrastructure/repositories/SupabaseCategoryRepository';
import { GetCategoryTreeUseCase } from '@/core/application/catalog/use-cases/GetCategoryTreeUseCase';
import type { CategoryTreeNode } from '@/core/application/catalog/dtos/CategoryTreeDTO';

export interface GetCategoryTreeActionResult {
  success: boolean;
  data?: CategoryTreeNode[];
  error?: string;
}

/**
 * 카테고리 계층형 트리 조회 Server Action
 */
export async function getCategoryTreeAction(): Promise<GetCategoryTreeActionResult> {
  try {
    const categoryRepository = new SupabaseCategoryRepository();
    const useCase = new GetCategoryTreeUseCase(categoryRepository);
    const result = await useCase.execute();

    if (result.isFailure) {
      return { success: false, error: result.getError().message };
    }

    return { success: true, data: result.getValue() };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '카테고리를 불러오지 못했습니다.',
    };
  }
}
