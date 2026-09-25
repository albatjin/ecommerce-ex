'use client';

import { useState, useTransition } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  EyeOff,
  Image as ImageIcon,
  RotateCw,
} from 'lucide-react';
import {
  toggleProductStatusAction,
  deleteProductAction,
} from '@/app/actions/product-admin.actions';
import { ProductEditorModal } from './ProductEditorModal';
import type {
  GetProductsResultDTO,
  ProductSummaryDTO,
} from '@/core/application/catalog/dtos/GetProductsDTO';
import type { CategoryTreeNode } from '@/core/application/catalog/dtos/CategoryTreeDTO';
import type { ProductStatus } from '@/shared/types/database.types';
import {
  flattenCategoryTree,
  getCategoryDescendantIds,
  DEFAULT_CATEGORIES,
} from '@/shared/data/defaultCategories';

interface AdminProductListViewerProps {
  initialData: GetProductsResultDTO;
  categories?: CategoryTreeNode[];
}

export function AdminProductListViewer({
  initialData,
  categories = [],
}: AdminProductListViewerProps) {
  const [products, setProducts] = useState<ProductSummaryDTO[]>(initialData.products);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductSummaryDTO | null>(null);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // 카테고리 계층 평탄화 및 Fallback 처리
  const effectiveCategories = categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES;
  const flatCategories = flattenCategoryTree(effectiveCategories);

  // 필터링 적용 목록
  const filteredProducts = products.filter((p) => {
    if (selectedStatus !== 'ALL' && p.status !== selectedStatus) {
      return false;
    }
    if (selectedCategory) {
      const allowedCategoryIds = getCategoryDescendantIds(selectedCategory, effectiveCategories);
      if (!p.categoryId || !allowedCategoryIds.has(p.categoryId)) {
        return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.nameKo.toLowerCase().includes(q);
      const matchCode = p.productCode.toLowerCase().includes(q);
      const matchBrand = p.brandName ? p.brandName.toLowerCase().includes(q) : false;
      if (!matchName && !matchCode && !matchBrand) return false;
    }
    return true;
  });

  // 상태 통계 카운트
  const activeCount = products.filter((p) => p.status === 'ACTIVE').length;
  const outOfStockCount = products.filter((p) => p.status === 'OUT_OF_STOCK').length;
  const hiddenCount = products.filter((p) => p.status === 'HIDDEN').length;

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: ProductSummaryDTO) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleProductSaved = (savedProduct: ProductSummaryDTO) => {
    setProducts((prev) => {
      const existsIndex = prev.findIndex((p) => p.id === savedProduct.id);
      if (existsIndex >= 0) {
        const copy = [...prev];
        copy[existsIndex] = savedProduct;
        return copy;
      }
      return [savedProduct, ...prev];
    });
    setFeedback({
      type: 'success',
      text: `상품 [${savedProduct.nameKo}] 정보가 성공적으로 반영되었습니다.`,
    });
  };

  const handleStatusChange = (product: ProductSummaryDTO, newStatus: ProductStatus) => {
    startTransition(async () => {
      const result = await toggleProductStatusAction({
        id: product.id,
        status: newStatus,
      });

      if (result.success && result.data) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, status: newStatus } : p))
        );
        setFeedback({
          type: 'success',
          text: `[${product.nameKo}] 상태가 '${newStatus}'로 변경되었습니다.`,
        });
      } else {
        setFeedback({
          type: 'error',
          text: result.error || '상태 변경 중 오류가 발생했습니다.',
        });
      }
    });
  };

  const handleDelete = (productId: string, productName: string) => {
    if (!window.confirm(`정말로 상품 [${productName}]을(를) 삭제하시겠습니까?`)) {
      return;
    }

    startTransition(async () => {
      const result = await deleteProductAction(productId);
      if (result.success) {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        setFeedback({
          type: 'success',
          text: `상품 [${productName}]이(가) 삭제되었습니다.`,
        });
      } else {
        setFeedback({
          type: 'error',
          text: result.error || '상품 삭제 실패',
        });
      }
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. 상단 타이틀 & 등록 액션 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            상품 통합 관리 (CMS)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            등록된 카탈로그 상품을 조회하고, 신규 상품 등록 및 재고/가격/진열 상태를 통제합니다.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>신규 상품 등록</span>
        </button>
      </div>

      {/* 2. 상태별 카운트 요약 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">전체 상품</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
            {products.length}
            <span className="text-xs font-normal text-slate-400 ml-1">개</span>
          </span>
        </div>

        <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs">
          <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 block">
            정상 판매중
          </span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {activeCount}
            <span className="text-xs font-normal text-emerald-500/70 ml-1">개</span>
          </span>
        </div>

        <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 shadow-xs">
          <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 block">
            일시 품절
          </span>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
            {outOfStockCount}
            <span className="text-xs font-normal text-amber-500/70 ml-1">개</span>
          </span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/40 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">비진열/숨김</span>
          <span className="text-2xl font-black text-slate-600 dark:text-slate-300 mt-1 block">
            {hiddenCount}
            <span className="text-xs font-normal text-slate-400 ml-1">개</span>
          </span>
        </div>
      </div>

      {/* 3. 피드백 알림 배너 */}
      {feedback && (
        <div
          role="status"
          className={`p-3.5 rounded-xl text-sm flex items-center justify-between transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 4. 검색 & 필터 바 */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* 검색창 */}
          <div className="relative w-full md:w-96">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="상품명, 상품코드, 브랜드명 검색..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:outline-none transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* 카테고리 필터 */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              aria-label="카테고리 필터"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full md:w-48 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="">모든 카테고리</option>
              {flatCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.displayName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 상태별 탭 필터 */}
        <div className="flex gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/60 overflow-x-auto text-xs font-semibold">
          {[
            { id: 'ALL', label: `전체 (${products.length})` },
            { id: 'ACTIVE', label: `판매중 (${activeCount})` },
            { id: 'OUT_OF_STOCK', label: `품절 (${outOfStockCount})` },
            { id: 'HIDDEN', label: `숨김 (${hiddenCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                selectedStatus === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 5. 상품 목록 테이블 */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 w-16">이미지</th>
                <th className="py-3 px-4">상품 코드 / 상품명</th>
                <th className="py-3 px-4">판매가 (정가)</th>
                <th className="py-3 px-4 text-center">재고</th>
                <th className="py-3 px-4 text-center">진열 상태</th>
                <th className="py-3 px-4 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 text-slate-300 opacity-60" />
                    조건에 해당하는 상품이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* 이미지 */}
                    <td className="py-3 px-4">
                      <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                        {p.coverImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.coverImageUrl}
                            alt={p.nameKo}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-slate-300" />
                        )}
                      </div>
                    </td>

                    {/* 상품 코드 및 상품명 */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-mono text-slate-400 block">
                          {p.productCode}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">
                          {p.nameKo}
                        </span>
                        {p.brandName && (
                          <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold block">
                            {p.brandName}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 가격 & 할인율 */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                            {p.salePrice.toLocaleString()}원
                          </span>
                          {p.discountRate > 0 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                              {p.discountRate}%
                            </span>
                          )}
                        </div>
                        {p.regularPrice > p.salePrice && (
                          <span className="text-[11px] text-slate-400 line-through block">
                            {p.regularPrice.toLocaleString()}원
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 재고 */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`font-extrabold text-xs px-2 py-0.5 rounded-full ${
                          p.stockQuantity === 0
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                            : p.stockQuantity < 10
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {p.stockQuantity}개
                      </span>
                    </td>

                    {/* 상태 변경 드롭다운 */}
                    <td className="py-3 px-4 text-center">
                      <select
                        aria-label={`상품 ${p.nameKo} 상태 변경`}
                        value={p.status}
                        onChange={(e) =>
                          handleStatusChange(p, e.target.value as ProductStatus)
                        }
                        disabled={isPending}
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer focus:outline-none ${
                          p.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                            : p.status === 'OUT_OF_STOCK'
                            ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                            : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                        }`}
                      >
                        <option value="ACTIVE">판매중</option>
                        <option value="OUT_OF_STOCK">품절</option>
                        <option value="HIDDEN">숨김</option>
                        <option value="DISCONTINUED">단종</option>
                      </select>
                    </td>

                    {/* 액션 버튼 */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(p)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="상품 수정"
                          aria-label={`상품 ${p.nameKo} 수정`}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id, p.nameKo)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="상품 삭제"
                          aria-label={`상품 ${p.nameKo} 삭제`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. 신규 등록 및 수정 모달 */}
      <ProductEditorModal
        key={editingProduct?.id || (isModalOpen ? 'create' : 'closed')}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={handleProductSaved}
        product={editingProduct}
        categories={effectiveCategories}
      />
    </div>
  );
}
