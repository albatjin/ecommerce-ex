import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProductDetailAction } from '@/app/actions/catalog.actions';
import { ProductDetailViewer } from '@/components/catalog';
import { getMockProductDetail } from '@/shared/data/mockProducts';
import type { Metadata } from 'next';
import type { ProductDetailDTO } from '@/core/application/catalog/dtos/ProductDetailDTO';

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

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

  const fallback = getMockProductDetail(id);
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
  } else {
    product = getMockProductDetail(id);
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
