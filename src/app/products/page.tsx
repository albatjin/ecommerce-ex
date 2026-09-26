import Link from 'next/link';
import { FilterSidebar, ProductGrid, SortSelect } from '@/components/catalog';
import { getCategoryTreeAction, getProductsAction } from '@/app/actions/catalog.actions';
import { MOCK_PRODUCTS } from '@/shared/data/mockProducts';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '전체 상품 카탈로그 | aramdream store',
  description: '프리미엄 패션, 디지털, 리빙 라이프스타일 셀렉션',
};

interface ProductsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const resolvedParams = await searchParams;

  const searchQuery = typeof resolvedParams.q === 'string' ? resolvedParams.q : undefined;
  const categorySlug =
    typeof resolvedParams.category === 'string' ? resolvedParams.category : undefined;
  const minPrice =
    typeof resolvedParams.minPrice === 'string' ? Number(resolvedParams.minPrice) : undefined;
  const maxPrice =
    typeof resolvedParams.maxPrice === 'string' ? Number(resolvedParams.maxPrice) : undefined;
  const hasDiscount = resolvedParams.hasDiscount === 'true';
  const sortBy = (typeof resolvedParams.sort === 'string'
    ? resolvedParams.sort
    : 'created_at') as 'created_at' | 'price_asc' | 'price_desc' | 'popular';
  const page = Math.max(1, typeof resolvedParams.page === 'string' ? Number(resolvedParams.page) : 1);
  const pageSize = 8; // 한 페이지당 8개 상품 표시 (페이지네이션 즉시 확인 가능)

  // 1. 카테고리 트리 조회
  const categoryTreeResult = await getCategoryTreeAction();
  const categories =
    categoryTreeResult.success && categoryTreeResult.data ? categoryTreeResult.data : [];

  // 2. 상품 목록 조회 (DB 연동 시도)
  const productsResult = await getProductsAction({
    searchQuery,
    categorySlug,
    minPrice,
    maxPrice,
    hasDiscount,
    sortBy,
    page,
    limit: pageSize,
  });

  let products =
    productsResult.success && productsResult.data?.products ? productsResult.data.products : [];
  let totalCount = productsResult.data?.totalCount ?? 0;
  let totalPages = productsResult.data?.totalPages ?? 1;

  // DB에 데이터가 없거나 초기 단계일 때 확장 샘플 데이터로 필터링 및 페이지네이션 제공
  if (products.length === 0 && totalCount === 0) {
    let filtered = [...MOCK_PRODUCTS];

    if (categorySlug) {
      filtered = filtered.filter((p) => p.categoryId === categorySlug);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) => p.nameKo.toLowerCase().includes(q) || (p.nameEn && p.nameEn.toLowerCase().includes(q))
      );
    }
    if (minPrice !== undefined) {
      filtered = filtered.filter((p) => p.salePrice >= minPrice);
    }
    if (maxPrice !== undefined) {
      filtered = filtered.filter((p) => p.salePrice <= maxPrice);
    }
    if (hasDiscount) {
      filtered = filtered.filter((p) => p.discountRate > 0);
    }

    // 정렬
    if (sortBy === 'price_asc') {
      filtered.sort((a, b) => a.salePrice - b.salePrice);
    } else if (sortBy === 'price_desc') {
      filtered.sort((a, b) => b.salePrice - a.salePrice);
    } else if (sortBy === 'popular') {
      filtered.sort((a, b) => b.stockQuantity - a.stockQuantity);
    } else {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    totalCount = filtered.length;
    totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const offset = (page - 1) * pageSize;
    products = filtered.slice(offset, offset + pageSize);
  }

  // 선택된 카테고리 이름 찾기
  const currentCategoryObj = categories.find((c) => c.slug === categorySlug);
  const categoryTitle = currentCategoryObj ? currentCategoryObj.name : '전체 상품';

  return (
    <div className="container-custom py-8">
      {/* 1. 브레드크럼 */}
      <nav
        className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-6"
        aria-label="현재 위치"
      >
        <Link href="/" className="hover:text-blue-600 transition-colors">
          홈
        </Link>
        <span>/</span>
        <Link href="/products" className="hover:text-blue-600 transition-colors">
          상품 카탈로그
        </Link>
        {currentCategoryObj && (
          <>
            <span>/</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {currentCategoryObj.name}
            </span>
          </>
        )}
      </nav>

      {/* 2. 페이지 헤더 바 */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 mb-8 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {searchQuery ? `‘${searchQuery}’ 검색 결과` : categoryTitle}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            총 <span className="font-bold text-blue-600 dark:text-blue-400">{totalCount}개</span>의
            프리미엄 상품이 준비되어 있습니다. (페이지 {page} / {totalPages})
          </p>
        </div>

        {/* 정렬 순서 선택 드롭다운 */}
        <SortSelect currentSort={sortBy} />
      </div>

      {/* 3. 본문 2열 레이아웃: 좌측 필터 사이드바 + 우측 상품 그리드 */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* 좌측 사이드바 필터 */}
        <div className="w-full lg:w-64 shrink-0 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <FilterSidebar categories={categories} />
        </div>

        {/* 우측 상품 카드 그리드 & 페이지네이션 */}
        <div className="flex-1 w-full min-w-0">
          <ProductGrid
            products={products}
            totalCount={totalCount}
            currentPage={page}
            totalPages={totalPages}
          />
        </div>
      </div>
    </div>
  );
}
