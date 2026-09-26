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
import {
  DEFAULT_CATEGORIES,
  flattenCategoryTree,
  resolveCategoryUuid,
} from '@/shared/data/defaultCategories';
import { MOCK_PRODUCTS } from '@/shared/data/mockProducts';

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

/**
 * 관리자 샘플 데이터(기본 카테고리 18개 + 샘플 상품 12개 및 옵션) 일괄 시딩 Server Action
 */
export async function seedMockProductsAction(): Promise<AdminProductActionResult<{ count: number }>> {
  try {
    const { supabase } = await verifyAdminAuth();

    // 1. 기본 카테고리 전체 시딩 (depth 순차 처리)
    const flat = flattenCategoryTree(DEFAULT_CATEGORIES);
    for (const d of [1, 2, 3]) {
      const nodes = flat.filter((n) => n.depth === d);
      for (const node of nodes) {
        await supabase.from('categories').upsert(
          {
            id: node.id,
            name: node.name,
            slug: node.slug,
            depth: node.depth,
            parent_id: node.parentId,
            sort_order: 1,
            is_active: true,
          },
          { onConflict: 'slug' }
        );
      }
    }

    // 2. MOCK_PRODUCTS 12개 상품 일괄 시딩
    let count = 0;
    for (const mock of MOCK_PRODUCTS) {
      const categoryUuid = resolveCategoryUuid(mock.categoryId, DEFAULT_CATEGORIES);

      const productPayload = {
        product_code: mock.productCode,
        name_ko: mock.nameKo,
        name_en: mock.nameEn || null,
        category_id: categoryUuid || null,
        regular_price: mock.regularPrice,
        sale_price: mock.salePrice,
        discount_rate: mock.discountRate,
        tax_type: (mock.taxType || 'TAXABLE') as 'TAXABLE' | 'TAX_EXEMPT',
        stock_quantity: mock.stockQuantity,
        status: (mock.status || 'ACTIVE') as 'ACTIVE' | 'OUT_OF_STOCK' | 'HIDDEN' | 'DRAFT',
        brand_name: mock.brandName || null,
        description: mock.description || null,
        cover_image_url: mock.coverImageUrl || null,
        additional_images: mock.additionalImages || [],
        shipping_fee: mock.shippingFee || 0,
      };

      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('product_code', mock.productCode)
        .maybeSingle();

      let productId: string;
      if (existing) {
        const { data } = await supabase
          .from('products')
          .update(productPayload)
          .eq('id', existing.id)
          .select('id')
          .single();
        if (data) productId = data.id;
        else continue;
      } else {
        const { data } = await supabase
          .from('products')
          .insert(productPayload)
          .select('id')
          .single();
        if (data) productId = data.id;
        else continue;
      }

      count++;

      // 3. 상품별 옵션(Variants) 시딩
      if (mock.variants && mock.variants.length > 0) {
        for (const v of mock.variants) {
          const variantPayload = {
            product_id: productId,
            sku_code: v.skuCode,
            variant_name: v.variantName,
            options: v.options || {},
            additional_price: v.additionalPrice || 0,
            stock_quantity: v.stockQuantity || 0,
            status: (v.status || 'ACTIVE') as 'ACTIVE' | 'LOW_STOCK' | 'OUT_OF_STOCK',
          };

          const { data: existingVariant } = await supabase
            .from('product_variants')
            .select('id')
            .eq('product_id', productId)
            .eq('sku_code', v.skuCode)
            .maybeSingle();

          if (existingVariant) {
            await supabase
              .from('product_variants')
              .update(variantPayload)
              .eq('id', existingVariant.id);
          } else {
            await supabase
              .from('product_variants')
              .insert(variantPayload);
          }
        }
      }
    }

    revalidatePath('/admin/products');
    revalidatePath('/products');
    revalidatePath('/', 'layout');

    return {
      success: true,
      data: { count },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '샘플 데이터 등록 실패',
    };
  }
}

