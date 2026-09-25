'use server';

import { revalidatePath } from 'next/cache';
import { getServerClient } from '@/core/infrastructure/supabase/server';
import { SupabaseProductRepository } from '@/core/infrastructure/repositories/SupabaseProductRepository';
import {
  GetProductsUseCase,
  CreateProductUseCase,
  UpdateProductUseCase,
  ToggleProductStatusUseCase,
  DeleteProductUseCase,
  type GetProductsQueryDTO,
  type GetProductsResultDTO,
  type ProductSummaryDTO,
  type CreateProductInputDTO,
  type UpdateProductInputDTO,
  type ToggleProductStatusDTO,
} from '@/core/application/catalog';
import { checkIsAdmin } from '@/shared/utils/admin';

export interface AdminProductActionResult<T> {
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
 * 관리자 상품 목록 조회 Server Action
 */
export async function getAdminProductsAction(
  query: GetProductsQueryDTO = {}
): Promise<AdminProductActionResult<GetProductsResultDTO>> {
  try {
    const { supabase } = await verifyAdminAuth();
    const productRepo = new SupabaseProductRepository(supabase);
    const useCase = new GetProductsUseCase(productRepo);

    const result = await useCase.execute({
      ...query,
      limit: query.limit ?? 20,
    });

    if (result.isFailure) {
      return {
        success: false,
        error: result.getError().message,
      };
    }

    return {
      success: true,
      data: result.getValue(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '상품 목록 조회 실패',
    };
  }
}

/**
 * 관리자 신규 상품 등록 Server Action
 */
export async function createProductAction(
  dto: CreateProductInputDTO
): Promise<AdminProductActionResult<ProductSummaryDTO>> {
  try {
    const { supabase } = await verifyAdminAuth();
    const productRepo = new SupabaseProductRepository(supabase);
    const useCase = new CreateProductUseCase(productRepo);

    const result = await useCase.execute(dto);

    if (result.isFailure) {
      return {
        success: false,
        error: result.getError().message,
      };
    }

    revalidatePath('/admin/products');
    revalidatePath('/products');
    revalidatePath('/', 'layout');

    return {
      success: true,
      data: result.getValue(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '상품 등록 처리 실패',
    };
  }
}

/**
 * 관리자 상품 정보 수정 Server Action
 */
export async function updateProductAction(
  dto: UpdateProductInputDTO
): Promise<AdminProductActionResult<ProductSummaryDTO>> {
  try {
    const { supabase } = await verifyAdminAuth();
    const productRepo = new SupabaseProductRepository(supabase);
    const useCase = new UpdateProductUseCase(productRepo);

    const result = await useCase.execute(dto);

    if (result.isFailure) {
      return {
        success: false,
        error: result.getError().message,
      };
    }

    revalidatePath('/admin/products');
    revalidatePath(`/products/${dto.id}`);
    revalidatePath('/products');
    revalidatePath('/', 'layout');

    return {
      success: true,
      data: result.getValue(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '상품 정보 수정 실패',
    };
  }
}

/**
 * 관리자 상품 상태(ACTIVE / OUT_OF_STOCK / HIDDEN) 토글 Server Action
 */
export async function toggleProductStatusAction(
  dto: ToggleProductStatusDTO
): Promise<AdminProductActionResult<ProductSummaryDTO>> {
  try {
    const { supabase } = await verifyAdminAuth();
    const productRepo = new SupabaseProductRepository(supabase);
    const useCase = new ToggleProductStatusUseCase(productRepo);

    const result = await useCase.execute(dto);

    if (result.isFailure) {
      return {
        success: false,
        error: result.getError().message,
      };
    }

    revalidatePath('/admin/products');
    revalidatePath('/products');

    return {
      success: true,
      data: result.getValue(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '상품 상태 변경 실패',
    };
  }
}

/**
 * 관리자 상품 삭제 Server Action
 */
export async function deleteProductAction(
  id: string
): Promise<AdminProductActionResult<void>> {
  try {
    const { supabase } = await verifyAdminAuth();
    const productRepo = new SupabaseProductRepository(supabase);
    const useCase = new DeleteProductUseCase(productRepo);

    const result = await useCase.execute(id);

    if (result.isFailure) {
      return {
        success: false,
        error: result.getError().message,
      };
    }

    revalidatePath('/admin/products');
    revalidatePath('/products');

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '상품 삭제 처리 실패',
    };
  }
}

/**
 * 관리자 상품 이미지 Supabase Storage 업로드 Server Action
 */
export async function uploadProductImageAction(
  formData: FormData
): Promise<AdminProductActionResult<{ url: string; path: string }>> {
  try {
    const { supabase } = await verifyAdminAuth();
    const file = formData.get('file') as File | null;

    if (!file) {
      return {
        success: false,
        error: '업로드할 이미지 파일이 선택되지 않았습니다.',
      };
    }

    // 파일 확장자 및 고유 파일명 생성
    const ext = file.name.split('.').pop() || 'png';
    const cleanName = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${Date.now()}_${cleanName}.${ext}`;
    const filePath = `uploads/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      return {
        success: false,
        error: `스토리지 업로드 실패: ${uploadError.message}`,
      };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('product-images').getPublicUrl(filePath);

    return {
      success: true,
      data: {
        url: publicUrl,
        path: filePath,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '이미지 업로드 처리 실패',
    };
  }
}
