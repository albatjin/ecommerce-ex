import Link from 'next/link';
import { FilterSidebar, ProductGrid, SortSelect } from '@/components/catalog';
import { getCategoryTreeAction, getProductsAction } from '@/app/actions/catalog.actions';
import type { ProductSummaryDTO } from '@/core/application/catalog/dtos/GetProductsDTO';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '전체 상품 카탈로그 | CommerceHub',
  description: '프리미엄 패션, 디지털, 리빙 라이프스타일 셀렉션',
};

// DB 초기화 전 사용자 즉시 체험용 샘플 데이터
const FALLBACK_PRODUCTS: ProductSummaryDTO[] = [
  {
    id: 'sample-1',
    productCode: 'PROD-COAT-01',
    nameKo: '프리미엄 울 캐시미어 오버핏 코트',
    nameEn: 'Premium Wool Cashmere Overfit Coat',
    categoryId: 'fashion',
    regularPrice: 289000,
    salePrice: 219000,
    discountRate: 24,
    taxType: 'TAXABLE',
    status: 'ACTIVE',
    stockQuantity: 18,
    isOrderable: true,
    brandName: 'Studio Minimal',
    coverImageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
    shippingFee: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sample-2',
    productCode: 'PROD-KNIT-02',
    nameKo: '헤비웨이트 파인 메리노울 니트',
    nameEn: 'Heavyweight Fine Merino Wool Knit',
    categoryId: 'fashion',
    regularPrice: 119000,
    salePrice: 89000,
    discountRate: 25,
    taxType: 'TAXABLE',
    status: 'ACTIVE',
    stockQuantity: 42,
    isOrderable: true,
    brandName: 'Studio Minimal',
    coverImageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=600&q=80',
    shippingFee: 3000,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sample-3',
    productCode: 'PROD-HEADPHONE-03',
    nameKo: '노이즈 캔슬링 프리미엄 무선 헤드폰 H1',
    nameEn: 'Active Noise Cancelling Wireless Headphones',
    categoryId: 'digital',
    regularPrice: 380000,
    salePrice: 329000,
    discountRate: 13,
    taxType: 'TAXABLE',
    status: 'ACTIVE',
    stockQuantity: 12,
    isOrderable: true,
    brandName: 'SonicCraft',
    coverImageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    shippingFee: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sample-4',
    productCode: 'PROD-DIFFUSER-04',
    nameKo: '시그니처 아로마 천연 디퓨저 200ml',
    nameEn: 'Signature Aroma Natural Diffuser',
    categoryId: 'living',
    regularPrice: 48000,
    salePrice: 48000,
    discountRate: 0,
    taxType: 'TAXABLE',
    status: 'ACTIVE',
    stockQuantity: 55,
    isOrderable: true,
    brandName: 'Botanical Atelier',
    coverImageUrl: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80',
    shippingFee: 3000,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sample-5',
    productCode: 'PROD-BAG-05',
    nameKo: '이탈리안 레더 클래식 토트백',
    nameEn: 'Italian Leather Classic Tote Bag',
    categoryId: 'fashion',
    regularPrice: 220000,
    salePrice: 176000,
    discountRate: 20,
    taxType: 'TAXABLE',
    status: 'ACTIVE',
    stockQuantity: 8,
    isOrderable: true,
    brandName: 'Milano Heritage',
    coverImageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=600&q=80',
    shippingFee: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sample-6',
    productCode: 'PROD-KEYBOARD-06',
    nameKo: '알루미늄 하우징 무선 기계식 키보드 K8',
    nameEn: 'Wireless Mechanical Keyboard Aluminum Frame',
    categoryId: 'digital',
    regularPrice: 179000,
    salePrice: 159000,
    discountRate: 11,
    taxType: 'TAXABLE',
    status: 'ACTIVE',
    stockQuantity: 0,
    isOrderable: false,
    brandName: 'TechForge',
    coverImageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
    shippingFee: 3000,
    createdAt: new Date().toISOString(),
  },
];

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
  const page = typeof resolvedParams.page === 'string' ? Number(resolvedParams.page) : 1;

  // 1. 카테고리 트리 조회
  const categoryTreeResult = await getCategoryTreeAction();
  const categories = categoryTreeResult.success && categoryTreeResult.data ? categoryTreeResult.data : [];

  // 2. 상품 목록 조회
  const productsResult = await getProductsAction({
    searchQuery,
    categorySlug,
    minPrice,
    maxPrice,
    hasDiscount,
    sortBy,
    page,
    limit: 12,
  });

  let products = productsResult.success && productsResult.data?.products ? productsResult.data.products : [];
  let totalCount = productsResult.data?.totalCount ?? 0;
  let totalPages = productsResult.data?.totalPages ?? 1;

  // DB에 데이터가 없는 경우 초기 폴백 샘플 제공
  if (products.length === 0 && !searchQuery && !categorySlug && !minPrice && !maxPrice && !hasDiscount) {
    products = FALLBACK_PRODUCTS;
    totalCount = FALLBACK_PRODUCTS.length;
    totalPages = 1;
  }

  // 선택된 카테고리 이름 찾기
  const currentCategoryObj = categories.find((c) => c.slug === categorySlug);
  const categoryTitle = currentCategoryObj ? currentCategoryObj.name : '전체 상품';

  return (
    <div className="container-custom py-8">
      {/* 1. 브레드크럼 */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-6" aria-label="현재 위치">
        <Link href="/" className="hover:text-blue-600 transition-colors">홈</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-blue-600 transition-colors">상품 카탈로그</Link>
        {currentCategoryObj && (
          <>
            <span>/</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{currentCategoryObj.name}</span>
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
            총 <span className="font-bold text-blue-600 dark:text-blue-400">{totalCount}개</span>의 프리미엄 상품이 준비되어 있습니다.
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

        {/* 우측 상품 카드 그리드 */}
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
