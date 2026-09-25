import type { Metadata } from 'next';
import { getAdminProductsAction } from '@/app/actions/product-admin.actions';
import { getCategoryTreeAction } from '@/app/actions/catalog.actions';
import { AdminProductListViewer } from '@/components/admin/products/AdminProductListViewer';
import type { GetProductsResultDTO } from '@/core/application/catalog/dtos/GetProductsDTO';
import { DEFAULT_CATEGORIES } from '@/shared/data/defaultCategories';
import { MOCK_PRODUCTS } from '@/shared/data/mockProducts';

export const metadata: Metadata = {
  title: '상품 통합 관리 (CMS) | CommerceHub Admin',
  description: '등록된 카탈로그 상품 조회, 신규 상품 등록 및 수정, 재고/가격/진열 상태 통제',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminProductsPage() {
  const [productRes, categoryRes] = await Promise.all([
    getAdminProductsAction({ limit: 50 }),
    getCategoryTreeAction(),
  ]);

  const fallbackData: GetProductsResultDTO = {
    products: MOCK_PRODUCTS,
    totalCount: MOCK_PRODUCTS.length,
    currentPage: 1,
    limit: 50,
    totalPages: 1,
    hasPrevPage: false,
    hasNextPage: false,
  };

  const initialData =
    productRes.success && productRes.data && productRes.data.products.length > 0
      ? productRes.data
      : fallbackData;
  const categories =
    categoryRes.success && categoryRes.data && categoryRes.data.length > 0
      ? categoryRes.data
      : DEFAULT_CATEGORIES;

  return (
    <AdminProductListViewer
      initialData={initialData}
      categories={categories}
    />
  );
}
