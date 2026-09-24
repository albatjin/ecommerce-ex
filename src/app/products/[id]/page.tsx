import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProductDetailAction } from '@/app/actions/catalog.actions';
import { ProductDetailViewer } from '@/components/catalog';
import type { Metadata } from 'next';
import type { ProductDetailDTO } from '@/core/application/catalog/dtos/ProductDetailDTO';

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

// 초기 DB 연결 전 샘플 상세 데이터 폴백 맵
const SAMPLE_DETAILS: Record<string, ProductDetailDTO> = {
  'sample-1': {
    id: 'sample-1',
    productCode: 'PROD-COAT-01',
    nameKo: '프리미엄 울 캐시미어 오버핏 코트',
    nameEn: 'Premium Wool Cashmere Overfit Coat',
    categoryId: 'fashion',
    categoryName: '패션의류/잡화',
    categorySlug: 'fashion',
    regularPrice: 289000,
    salePrice: 219000,
    discountRate: 24,
    taxType: 'TAXABLE',
    maxOrderQuantity: 5,
    stockQuantity: 18,
    safetyStock: 3,
    status: 'ACTIVE',
    isOrderable: true,
    brandName: 'Studio Minimal',
    description: `최고급 호주산 파인 메리노 울 90%와 몽골산 캐시미어 10% 혼방 원사로 제직된 프리미엄 핸드메이드 오버핏 코트입니다.
  
자연스럽게 떨어지는 드롭 숄더 라인과 우아한 실루엣이 돋보이며, 가벼운 중량감 대비 뛰어난 보온성을 제공합니다.
수제 공정의 섬세한 스티치 마감과 은은한 천연 소뿔 단추를 사용하여 하이엔드 퀄리티를 구현했습니다.`,
    coverImageUrl:
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80',
    ],
    shippingFee: 0,
    variants: [
      {
        id: 'var-s1-1',
        skuCode: 'COAT-BLK-M',
        variantName: '미드나잇 블랙 / M (95~100)',
        options: { color: 'Black', size: 'M' },
        additionalPrice: 0,
        stockQuantity: 10,
        status: 'ACTIVE',
        isAvailable: true,
      },
      {
        id: 'var-s1-2',
        skuCode: 'COAT-BLK-L',
        variantName: '미드나잇 블랙 / L (100~105)',
        options: { color: 'Black', size: 'L' },
        additionalPrice: 0,
        stockQuantity: 8,
        status: 'ACTIVE',
        isAvailable: true,
      },
      {
        id: 'var-s1-3',
        skuCode: 'COAT-CAM-M',
        variantName: '카멜 브라운 / M (95~100)',
        options: { color: 'Camel', size: 'M' },
        additionalPrice: 10000,
        stockQuantity: 0,
        status: 'OUT_OF_STOCK',
        isAvailable: false,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'sample-3': {
    id: 'sample-3',
    productCode: 'PROD-HEADPHONE-03',
    nameKo: '노이즈 캔슬링 프리미엄 무선 헤드폰 H1',
    nameEn: 'Active Noise Cancelling Wireless Headphones',
    categoryId: 'digital',
    categoryName: '디지털/가전',
    categorySlug: 'digital',
    regularPrice: 380000,
    salePrice: 329000,
    discountRate: 13,
    taxType: 'TAXABLE',
    maxOrderQuantity: 2,
    stockQuantity: 12,
    safetyStock: 2,
    status: 'ACTIVE',
    isOrderable: true,
    brandName: 'SonicCraft',
    description: `차세대 하이브리드 액티브 노이즈 캔슬링(ANC) 칩셋 탑재로 압도적인 몰입감을 선사하는 플래그십 무선 헤드폰입니다.
  
40mm 커스텀 바이오 셀룰로오스 드라이버가 전달하는 풍부한 저음과 선명한 고해상도 사운드를 경험해 보세요.
한 번의 충전으로 최대 45시간 연속 재생을 지원하며, 인체공학적 메모리폼 이어패드로 장시간 착용에도 편안합니다.`,
    coverImageUrl:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80',
    ],
    shippingFee: 0,
    variants: [
      {
        id: 'var-s3-1',
        skuCode: 'H1-MATTE-BLK',
        variantName: '매트 블랙',
        options: { color: 'Black' },
        additionalPrice: 0,
        stockQuantity: 8,
        status: 'ACTIVE',
        isAvailable: true,
      },
      {
        id: 'var-s3-2',
        skuCode: 'H1-SILVER',
        variantName: '플래티넘 실버',
        options: { color: 'Silver' },
        additionalPrice: 0,
        stockQuantity: 4,
        status: 'ACTIVE',
        isAvailable: true,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getProductDetailAction(id);

  if (result.success && result.data) {
    return {
      title: `${result.data.nameKo} | CommerceHub`,
      description: result.data.description?.slice(0, 120) || 'CommerceHub 프리미엄 상품',
    };
  }

  const fallback = SAMPLE_DETAILS[id];
  if (fallback) {
    return {
      title: `${fallback.nameKo} | CommerceHub`,
      description: fallback.description?.slice(0, 120),
    };
  }

  return {
    title: '상품 상세 정보 | CommerceHub',
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;

  let product: ProductDetailDTO | null = null;

  const result = await getProductDetailAction(id);
  if (result.success && result.data) {
    product = result.data;
  } else if (SAMPLE_DETAILS[id]) {
    product = SAMPLE_DETAILS[id];
  }

  if (!product) {
    notFound();
  }

  return (
    <div className="container-custom py-8">
      {/* 브레드크럼 */}
      <nav
        className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-8"
        aria-label="현재 위치"
      >
        <Link href="/" className="hover:text-blue-600 transition-colors">
          홈
        </Link>
        <span>/</span>
        <Link href="/products" className="hover:text-blue-600 transition-colors">
          상품 카탈로그
        </Link>
        {product.categoryName && (
          <>
            <span>/</span>
            <Link
              href={`/products?category=${product.categorySlug || ''}`}
              className="hover:text-blue-600 transition-colors"
            >
              {product.categoryName}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-xs">
          {product.nameKo}
        </span>
      </nav>

      {/* 상품 상세 뷰어 */}
      <ProductDetailViewer product={product} />
    </div>
  );
}

