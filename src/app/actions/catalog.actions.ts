'use server';

import { SupabaseCategoryRepository } from '@/core/infrastructure/repositories/SupabaseCategoryRepository';
import { SupabaseProductRepository } from '@/core/infrastructure/repositories/SupabaseProductRepository';
import { GetCategoryTreeUseCase } from '@/core/application/catalog/use-cases/GetCategoryTreeUseCase';
import { GetProductsUseCase } from '@/core/application/catalog/use-cases/GetProductsUseCase';
import { GetProductDetailUseCase } from '@/core/application/catalog/use-cases/GetProductDetailUseCase';
import type { CategoryTreeNode } from '@/core/application/catalog/dtos/CategoryTreeDTO';
import type {
  GetProductsQueryDTO,
  GetProductsResultDTO,
} from '@/core/application/catalog/dtos/GetProductsDTO';
import type { ProductDetailDTO } from '@/core/application/catalog/dtos/ProductDetailDTO';
import { DEFAULT_CATEGORIES } from '@/shared/data/defaultCategories';

export interface GetCategoryTreeActionResult {
  success: boolean;
  data?: CategoryTreeNode[];
  error?: string;
}

export interface GetProductsActionResult {
  success: boolean;
  data?: GetProductsResultDTO;
  error?: string;
}

export interface GetProductDetailActionResult {
  success: boolean;
  data?: ProductDetailDTO;
  error?: string;
  statusCode?: number;
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

    const data = result.getValue();
    return {
      success: true,
      data: data && data.length > 0 ? data : DEFAULT_CATEGORIES,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '카테고리를 불러오지 못했습니다.',
    };
  }
}

/**
 * 상품 목록 검색/다중필터/정렬/페이지네이션 Server Action
 */
export async function getProductsAction(
  query: GetProductsQueryDTO = {}
): Promise<GetProductsActionResult> {
  try {
    const productRepository = new SupabaseProductRepository();
    const categoryRepository = new SupabaseCategoryRepository();
    const useCase = new GetProductsUseCase(productRepository, categoryRepository);
    const result = await useCase.execute(query);

    if (result.isFailure) {
      return { success: false, error: result.getError().message };
    }

    return { success: true, data: result.getValue() };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '상품 목록을 불러오지 못했습니다.',
    };
  }
}

/**
 * 상품 상세 정보 및 SKU 옵션 조회 Server Action
 */
export async function getProductDetailAction(
  id: string
): Promise<GetProductDetailActionResult> {
  try {
    const productRepository = new SupabaseProductRepository();
    const categoryRepository = new SupabaseCategoryRepository();
    const useCase = new GetProductDetailUseCase(productRepository, categoryRepository);
    const result = await useCase.execute(id);

    if (result.isFailure) {
      const error = result.getError();
      return {
        success: false,
        error: error.message,
        statusCode: 'statusCode' in error ? (error as { statusCode: number }).statusCode : 500,
      };
    }

    return { success: true, data: result.getValue() };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '상품 상세 정보를 불러오지 못했습니다.',
      statusCode: 500,
    };
  }
}
