'use client';

import { ProductCard } from './ProductCard';
import { ChevronLeft, ChevronRight, PackageSearch } from 'lucide-react';
import type { ProductSummaryDTO } from '@/core/application/catalog/dtos/GetProductsDTO';

interface ProductGridProps {
  products: ProductSummaryDTO[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
  onAddToCart?: (productId: string) => void;
}

export function ProductGrid({
  products,
  totalCount,
  currentPage,
  totalPages,
  onPageChange,
  onAddToCart,
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-8">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-4">
          <PackageSearch className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
          일치하는 상품이 없습니다
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
          다른 검색어를 입력하시거나 필터(카테고리, 가격대 등)를 변경해 보세요.
        </p>
        <a
          href="/products"
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-sm"
        >
          전체 상품 보기
        </a>
      </div>
    );
  }

  // 페이지네이션 숫자 배열 계산 (최대 5개 노출)
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="space-y-8">
      {/* 상품 카드 반응형 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
        ))}
      </div>

      {/* 페이지네이션 바 */}
      {totalPages > 1 && (
        <nav
          className="flex items-center justify-center gap-1.5 pt-6 border-t border-slate-200 dark:border-slate-800"
          aria-label="상품 목록 페이지 이동"
        >
          {/* 이전 페이지 버튼 */}
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange && onPageChange(currentPage - 1)}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="이전 페이지"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* 페이지 번호 목록 */}
          {getPageNumbers().map((pageNum) => {
            const isActive = pageNum === currentPage;
            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange && onPageChange(pageNum)}
                className={`min-w-[38px] h-[38px] px-3 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {pageNum}
              </button>
            );
          })}

          {/* 다음 페이지 버튼 */}
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange && onPageChange(currentPage + 1)}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="다음 페이지"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </nav>
      )}
    </div>
  );
}

