'use client';

import Link from 'next/link';
import { ShoppingBag, Truck, Tag } from 'lucide-react';
import type { ProductSummaryDTO } from '@/core/application/catalog/dtos/GetProductsDTO';

interface ProductCardProps {
  product: ProductSummaryDTO;
  onAddToCart?: (productId: string) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const isOutOfStock = !product.isOrderable || product.status === 'OUT_OF_STOCK';
  const hasDiscount = product.discountRate > 0;

  return (
    <div className="group relative flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:border-blue-500/40 dark:hover:border-blue-500/40 transition-all duration-300">
      {/* 1. 이미지 및 상단 배지 영역 */}
      <Link
        href={`/products/${product.id}`}
        className="relative aspect-square w-full overflow-hidden bg-slate-100 dark:bg-slate-800 block cursor-pointer"
      >
        {product.coverImageUrl ? (
          <img
            src={product.coverImageUrl}
            alt={product.nameKo}
            className={`w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ${
              isOutOfStock ? 'grayscale opacity-60' : ''
            }`}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100 dark:bg-slate-800/80">
            <ShoppingBag className="w-12 h-12 stroke-1 opacity-40 mb-2" />
            <span className="text-xs font-medium">이미지 준비중</span>
          </div>
        )}

        {/* 할인율 배지 */}
        {hasDiscount && !isOutOfStock && (
          <span className="absolute top-3 left-3 bg-red-600 text-white font-extrabold text-xs px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
            <Tag className="w-3 h-3" />
            {product.discountRate}% OFF
          </span>
        )}

        {/* 무료배송 배지 */}
        {product.shippingFee === 0 && !isOutOfStock && (
          <span className="absolute top-3 right-3 bg-slate-900/80 dark:bg-slate-100/90 text-white dark:text-slate-900 font-semibold text-[11px] px-2 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1">
            <Truck className="w-3 h-3" />
            무료배송
          </span>
        )}

        {/* 품절 오버레이 */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center">
            <span className="px-4 py-1.5 rounded-full bg-slate-900/90 text-white font-bold text-sm tracking-wide shadow-lg border border-white/20">
              일시 품절
            </span>
          </div>
        )}
      </Link>

      {/* 2. 상품 정보 영역 */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* 브랜드명 */}
          {product.brandName && (
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 tracking-wider uppercase mb-1">
              {product.brandName}
            </p>
          )}

          {/* 상품명 */}
          <Link href={`/products/${product.id}`} className="block group-hover:text-blue-600 transition-colors">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">
              {product.nameKo}
            </h3>
            {product.nameEn && (
              <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                {product.nameEn}
              </p>
            )}
          </Link>
        </div>

        {/* 3. 가격 및 액션 바 */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-end justify-between">
          <div className="flex flex-col">
            {hasDiscount && (
              <span className="text-xs text-slate-400 line-through">
                {product.regularPrice.toLocaleString()}원
              </span>
            )}
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-slate-900 dark:text-white">
                {product.salePrice.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">원</span>
            </div>
          </div>

          {/* 장바구니 빠른 담기 버튼 */}
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={() => onAddToCart && onAddToCart(product.id)}
            className={`p-2.5 rounded-xl transition-all cursor-pointer ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800'
                : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white dark:bg-blue-950/60 dark:text-blue-400 dark:hover:bg-blue-600 dark:hover:text-white active:scale-95'
            }`}
            aria-label={`${product.nameKo} 장바구니에 담기`}
            title={isOutOfStock ? '품절된 상품입니다' : '장바구니 담기'}
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
