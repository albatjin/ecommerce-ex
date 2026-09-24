import Link from 'next/link';
import { FilterSidebar, ProductGrid, SortSelect } from '@/components/catalog';
import { getCategoryTreeAction, getProductsAction } from '@/app/actions/catalog.actions';
import type { ProductSummaryDTO } from '@/core/application/catalog/dtos/GetProductsDTO';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '전체 상품 카탈로그 | CommerceHub',
  description: '프리미엄 패션, 디지털, 리빙 라이프스타일 셀렉션',
};

// 페이지네이션 및 필터 체험을 위한 24개 고품질 샘플 상품 데이터
const EXTENDED_FALLBACK_PRODUCTS: ProductSummaryDTO[] = [
  // --- 패션 (Fashion) ---
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
    createdAt: '2026-09-01T00:00:00.000Z',
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
    createdAt: '2026-09-02T00:00:00.000Z',
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
    createdAt: '2026-09-03T00:00:00.000Z',
  },
  {
    id: 'sample-7',
    productCode: 'PROD-SHIRT-07',
    nameKo: '수피마 코튼 클래식 드레스 셔츠',
    nameEn: 'Supima Cotton Classic Dress Shirt',
    categoryId: 'fashion',
    regularPrice: 79000,
    salePrice: 65000,
    discountRate: 18,
    taxType: 'TAXABLE',
    status: 'ACTIVE',
    stockQuantity: 30,
    isOrderable: true,
    brandName: 'Atelier Oxford',
    coverImageUrl: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=600&q=80',
    shippingFee: 3000,
    createdAt: '2026-09-04T00:00:00.000Z',
  },
  {
    id: 'sample-8',
    productCode: 'PROD-PANTS-08',
    nameKo: '와이드 테이퍼드 셋업 슬랙스',
    nameEn: 'Wide Tapered Setup Slacks',
    categoryId: 'fashion',
    regularPrice: 98000,
    salePrice: 79000,
    discountRate: 19,
    taxType: 'TAXABLE',
    status: 'ACTIVE',
    stockQuantity: 25,
    isOrderable: true,
    brandName: 'Studio Minimal',
    coverImageUrl: 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?auto=format&fit=crop&w=600&q=80',
    shippingFee: 3000,
    createdAt: '2026-09-05T00:00:00.000Z',
  },
  {
    id: 'sample-9',
    productCode: 'PROD-SHOES-09',
    nameKo: '카프스킨 미니멀 더비 슈즈',
    nameEn: 'Calfskin Minimal Derby Shoes',
    categoryId: 'fashion',
    regularPrice: 185000,
    salePrice: 185000,
    discountRate: 0,
    taxType: 'TAXABLE',
    status: 'ACTIVE',
    stockQuantity: 14,
    isOrderable: true,
    brandName: 'Milano Heritage',
    coverImageUrl: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=600&q=80',
    shippingFee: 0,
    createdAt: '2026-09-06T00:00:00.000Z',
  },

  // --- 디지털 / 가전 (Digital) ---
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
    createdAt: '2026-09-07T00:00:00.000Z',
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
    createdAt: '2026-09-08T00:00:00.000Z',
  },
  {
    id: 'sample-10',
    productCode: 'PROD-WATCH-10',
    nameKo: '티타늄 에디션 스마트 워치 Ultra',
    nameEn: 'Titanium Edition Smartwatch Ultra',
    categoryId: 'digital',
    regularPrice: 420000,
    salePrice: 357000,
    discountRate: 15,
    taxType: 'TAXABLE',
    status: 'ACTIVE',
    stockQuantity: 9,
    isOrderable: true,
    brandName: 'TechForge',
    coverImageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
    shippingFee: 0,
    createdAt: '2026-09-09T00:00:00.000Z',
  },
  {
    id: 'sample-11',
    productCode: 'PROD-SPEAKER-11',
    nameKo: '포터블 하이파이 블루투스 스피커 Flare',
    nameEn: 'Portable Hi-Fi Bluetooth Speaker Flare',
    categoryId: 'digital',
    regularPrice: 139000,
    salePrice: 119000,
    discountRate: 14,
    taxType: 'TAXABLE',
    status: 'ACTIVE',
    stockQuantity: 20,
    isOrderable: true,
    brandName: 'SonicCraft',
    coverImageUrl: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=600&q=80',
    shippingFee: 3000,
    createdAt: '2026-09-10T00:00:00.000Z',
  },
  {
    id: 'sample-12',
    productCode: 'PROD-MOUSE-12',
    nameKo: '인체공학 버티컬 무선 마우스 Ergo',
    nameEn: 'Ergonomic Vertical Wireless Mouse Ergo',
    categoryId: 'digital',
    regularPrice: 69000,
    salePrice: 55000,
    discountRate: 20,
    taxType: 'TAXABLE',
    status: 'ACTIVE',
    stockQuantity: 35,
    isOrderable: true,
    brandName: 'TechForge',
    coverImageUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80',
    shippingFee: 3000,
    createdAt: '2026-09-11T00:00:00.000Z',
  },
  {
    id: 'sample-13',
    productCode: 'PROD-STAND-13',
    nameKo: '마그네틱 태블릿 알루미늄 거치대',
    nameEn: 'Magnetic Tablet Aluminum Desk Stand',
    categoryId: 'digital',
    regularPrice: 49000,
    salePrice: 42000,
    discountRate: 14,
    taxType: 'TAXABLE',
    status: 'ACTIVE',
    stockQuantity: 50,
    isOrderable: true,
    brandName: 'TechForge',
    coverImageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=600&q=80',
    shippingFee: 3000,
    createdAt: '2026-09-12T00:00:00.000Z',
  },

  // --- 홈 / 리빙 (Living) ---
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
    createdAt: '2026-09-13T00:00:00.000Z',
  },
  {
    id: 'sample-14',
    productCode: 'PROD-LAMP-14',
    nameKo: '미드센추리 모던 무드 조명 램프',
    nameEn: 'Mid-Century Modern Mood Desk Lamp',
    categoryId: 'living',
    regularPrice: 125000,
    salePrice: 99000,
    discountRate: 21,
    taxType: 'TAXABLE',
    status: 'ACTIVE',
    stockQuantity: 15,
    isOrderable: true,
    brandName: 'Nordic Space',
    coverImageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80',
    shippingFee: 0,
    createdAt: '2026-09-14T00:00:00.000Z',
  },
  {
    id: 'sample-15',
    productCode: 'PROD-CHAIR-15',
    nameKo: '오크 원목 곡목 다이닝 체어',
    nameEn: 'Solid Oak Curved Dining Chair',
    categoryId: 'living',
    regularPrice: 240000,
    salePrice: 198000,
    discountRate: 18,
    taxType: 'TAXABLE',
    status: 'ACTIVE',
    stockQuantity: 6,
    isOrderable: true,
    brandName: 'Nordic Space',
    coverImageUrl: 'https://images.unsplash.com/photo-1580481077197-033c46e319bf?auto=format&fit=crop&w=600&q=80',
    shippingFee: 0,
    createdAt: '2026-09-15T00:00:00.000Z',
  },
  {
    id: 'sample-16',
    productCode: 'PROD-CUP-16',
    nameKo: '도예 작가 핸드메이드 세라믹 머그 2P',
    nameEn: 'Handmade Ceramic Artisan Mug Set',
    categoryId: 'living',
    regularPrice: 38000,
    salePrice: 32000,
    discountRate: 16,
    taxType: 'TAXABLE',
    status: 'ACTIVE',
    stockQuantity: 40,
    isOrderable: true,
    brandName: 'Botanical Atelier',
    coverImageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
    shippingFee: 3000,
    createdAt: '2026-09-16T00:00:00.000Z',
  },
  {
    id: 'sample-17',
    productCode: 'PROD-CLOCK-17',
    nameKo: '미니멀 월넛 무소음 벽시계',
    nameEn: 'Minimal Walnut Silent Wall Clock',
    categoryId: 'living',
    regularPrice: 65000,
    salePrice: 52000,
    discountRate: 20,
    taxType: 'TAXABLE',
    status: 'ACTIVE',
    stockQuantity: 22,
    isOrderable: true,
    brandName: 'Nordic Space',
    coverImageUrl: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&w=600&q=80',
    shippingFee: 3000,
    createdAt: '2026-09-17T00:00:00.000Z',
  },
  {
    id: 'sample-18',
    productCode: 'PROD-BLANKET-18',
    nameKo: '오가닉 워싱 코튼 와플 블랭킷',
    nameEn: 'Organic Washed Cotton Waffle Blanket',
    categoryId: 'living',
    regularPrice: 89000,
    salePrice: 69000,
    discountRate: 22,
    taxType: 'TAXABLE',
    status: 'ACTIVE',
    stockQuantity: 19,
    isOrderable: true,
    brandName: 'Botanical Atelier',
    coverImageUrl: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=600&q=80',
    shippingFee: 3000,
    createdAt: '2026-09-18T00:00:00.000Z',
  },

  // --- 뷰티 / 스킨케어 (Beauty) ---
  {
    id: 'sample-19',
    productCode: 'PROD-PERFUME-19',
    nameKo: '오 드 퍼퓸 상탈 베르가못 50ml',
    nameEn: 'Eau de Parfum Santal Bergamot 50ml',
    categoryId: 'beauty',
    regularPrice: 145000,
    salePrice: 129000,
    discountRate: 11,
    taxType: 'TAXABLE',
    status: 'ACTIVE',
    stockQuantity: 15,
    isOrderable: true,
    brandName: 'Lumiere Scent',
    coverImageUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=600&q=80',
    shippingFee: 0,
    createdAt: '2026-09-19T00:00:00.000Z',
  },
  {
    id: 'sample-20',
    productCode: 'PROD-SERUM-20',
    nameKo: '비타민C 브라이트닝 앰플 세럼 30ml',
    nameEn: 'Vitamin C Brightening Ampoule Serum',
    categoryId: 'beauty',
    regularPrice: 52000,
    salePrice: 42000,
    discountRate: 19,
    taxType: 'TAXABLE',
    status: 'ACTIVE',
    stockQuantity: 60,
    isOrderable: true,
    brandName: 'Derma Pure',
    coverImageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80',
    shippingFee: 3000,
    createdAt: '2026-09-20T00:00:00.000Z',
  },
  {
    id: 'sample-21',
    productCode: 'PROD-CREAM-21',
    nameKo: '세라마이드 딥 하이드레이션 크림 80ml',
    nameEn: 'Ceramide Deep Hydration Barrier Cream',
    categoryId: 'beauty',
    regularPrice: 45000,
    salePrice: 38000,
    discountRate: 16,
    taxType: 'TAXABLE',
    status: 'ACTIVE',
    stockQuantity: 38,
    isOrderable: true,
    brandName: 'Derma Pure',
    coverImageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80',
    shippingFee: 3000,
    createdAt: '2026-09-21T00:00:00.000Z',
  },
  {
    id: 'sample-22',
    productCode: 'PROD-OIL-22',
    nameKo: '유기농 호호바 너리싱 페이셜 오일 50ml',
    nameEn: 'Organic Jojoba Nourishing Facial Oil',
    categoryId: 'beauty',
    regularPrice: 36000,
    salePrice: 36000,
    discountRate: 0,
    taxType: 'TAXABLE',
    status: 'ACTIVE',
    stockQuantity: 28,
    isOrderable: true,
    brandName: 'Lumiere Scent',
    coverImageUrl: 'https://images.unsplash.com/photo-1608248597359-21b9201990c7?auto=format&fit=crop&w=600&q=80',
    shippingFee: 3000,
    createdAt: '2026-09-22T00:00:00.000Z',
  },
  {
    id: 'sample-23',
    productCode: 'PROD-HAND-23',
    nameKo: '너리싱 퍼퓸 핸드크림 듀오 세트',
    nameEn: 'Nourishing Perfumed Hand Cream Duo',
    categoryId: 'beauty',
    regularPrice: 28000,
    salePrice: 22000,
    discountRate: 21,
    taxType: 'TAXABLE',
    status: 'ACTIVE',
    stockQuantity: 70,
    isOrderable: true,
    brandName: 'Lumiere Scent',
    coverImageUrl: 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=600&q=80',
    shippingFee: 3000,
    createdAt: '2026-09-23T00:00:00.000Z',
  },
  {
    id: 'sample-24',
    productCode: 'PROD-BALM-24',
    nameKo: '카밍 수딩 밤 멀티 유즈 100ml',
    nameEn: 'Calming Soothing Multi-Use Balm',
    categoryId: 'beauty',
    regularPrice: 32000,
    salePrice: 28000,
    discountRate: 12,
    taxType: 'TAXABLE',
    status: 'ACTIVE',
    stockQuantity: 45,
    isOrderable: true,
    brandName: 'Derma Pure',
    coverImageUrl: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=600&q=80',
    shippingFee: 3000,
    createdAt: '2026-09-24T00:00:00.000Z',
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
    let filtered = [...EXTENDED_FALLBACK_PRODUCTS];

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
