'use client';

import { useState, useTransition } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Save,
  AlertCircle,
  Package,
  Layers,
  Coins,
  FileText,
} from 'lucide-react';
import {
  createProductAction,
  updateProductAction,
  uploadProductImageAction,
} from '@/app/actions/product-admin.actions';
import type { ProductSummaryDTO } from '@/core/application/catalog/dtos/GetProductsDTO';
import type { CategoryTreeNode } from '@/core/application/catalog/dtos/CategoryTreeDTO';
import type { ProductStatus, ProductTaxType } from '@/shared/types/database.types';
import {
  flattenCategoryTree,
  resolveCategoryUuid,
  UUID_REGEX,
  DEFAULT_CATEGORIES,
} from '@/shared/data/defaultCategories';

interface ProductEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (product: ProductSummaryDTO) => void;
  product?: ProductSummaryDTO | null; // null이면 신규 등록 모드
  categories?: CategoryTreeNode[];
}

export function ProductEditorModal({
  isOpen,
  onClose,
  onSaved,
  product,
  categories = [],
}: ProductEditorModalProps) {
  const isEditMode = Boolean(product);

  const [nameKo, setNameKo] = useState(product?.nameKo || '');
  const [nameEn, setNameEn] = useState(product?.nameEn || '');
  const [categoryId, setCategoryId] = useState(product?.categoryId || '');
  const [regularPrice, setRegularPrice] = useState(product?.regularPrice || 0);
  const [salePrice, setSalePrice] = useState(product?.salePrice || 0);
  const [stockQuantity, setStockQuantity] = useState(product?.stockQuantity || 0);
  const [taxType, setTaxType] = useState<ProductTaxType>(product?.taxType || 'TAXABLE');
  const [brandName, setBrandName] = useState(product?.brandName || '');
  const [coverImageUrl, setCoverImageUrl] = useState(product?.coverImageUrl || '');
  const [shippingFee, setShippingFee] = useState(product?.shippingFee || 0);
  const [status, setStatus] = useState<ProductStatus>(product?.status || 'ACTIVE');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);

  // 카테고리 계층 평탄화 및 Fallback 처리
  const effectiveCategories = categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES;
  const flatCategories = flattenCategoryTree(effectiveCategories);

  if (!isOpen) return null;

  // 자동 할인율 계산
  const calculatedDiscountRate =
    regularPrice > 0 && salePrice <= regularPrice
      ? Math.round(((regularPrice - salePrice) / regularPrice) * 100)
      : 0;

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    const result = await uploadProductImageAction(formData);
    setIsUploading(false);

    if (result.success && result.data) {
      setCoverImageUrl(result.data.url);
    } else {
      setErrorMessage(result.error || '이미지 업로드에 실패했습니다.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!nameKo.trim()) {
      setErrorMessage('상품명(한글)을 입력해 주세요.');
      return;
    }

    if (salePrice > regularPrice) {
      setErrorMessage('판매가는 정가보다 클 수 없습니다.');
      return;
    }

    startTransition(async () => {
      const sanitizedCategoryId =
        resolveCategoryUuid(categoryId) ||
        (UUID_REGEX.test(categoryId) ? categoryId : null);

      if (isEditMode && product) {
        const result = await updateProductAction({
          id: product.id,
          nameKo: nameKo.trim(),
          nameEn: nameEn.trim() || null,
          categoryId: sanitizedCategoryId,
          regularPrice,
          salePrice,
          stockQuantity,
          taxType,
          brandName: brandName.trim() || null,
          coverImageUrl: coverImageUrl.trim() || null,
          shippingFee,
          status,
        });

        if (result.success && result.data) {
          onSaved(result.data);
          onClose();
        } else {
          setErrorMessage(result.error || '상품 정보 수정 실패');
        }
      } else {
        const result = await createProductAction({
          nameKo: nameKo.trim(),
          nameEn: nameEn.trim() || null,
          categoryId: sanitizedCategoryId,
          regularPrice,
          salePrice,
          stockQuantity,
          taxType,
          brandName: brandName.trim() || null,
          coverImageUrl: coverImageUrl.trim() || null,
          shippingFee,
          status,
        });

        if (result.success && result.data) {
          onSaved(result.data);
          onClose();
        } else {
          setErrorMessage(result.error || '신규 상품 등록 실패');
        }
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* 상단 모달 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isEditMode ? '상품 정보 수정' : '신규 상품 등록'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 폼 본체 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2 border border-rose-200 dark:border-rose-900/60">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. 기본 정보 섹션 */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> 기본 상품 정보
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="modal-nameKo" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  상품명 (한글) <span className="text-rose-500">*</span>
                </label>
                <input
                  id="modal-nameKo"
                  type="text"
                  required
                  value={nameKo}
                  onChange={(e) => setNameKo(e.target.value)}
                  placeholder="예: 프리미엄 오버핏 울 블레이저"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="modal-nameEn" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  영문 상품명 (선택)
                </label>
                <input
                  id="modal-nameEn"
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="예: Premium Wool Blazer"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="modal-category" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  카테고리 분류
                </label>
                <select
                  id="modal-category"
                  value={resolveCategoryUuid(categoryId) || categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">카테고리 선택 (없음)</option>
                  {flatCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.displayName}
                    </option>
                  ))}
                  {Boolean(
                    categoryId &&
                      !flatCategories.some(
                        (cat) => cat.id === (resolveCategoryUuid(categoryId) || categoryId)
                      )
                  ) && (
                    <option value={categoryId}>기타 카테고리 ({categoryId})</option>
                  )}
                </select>
              </div>

              <div>
                <label htmlFor="modal-brandName" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  브랜드명
                </label>
                <input
                  id="modal-brandName"
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="예: Acné Studio"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="modal-status" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  진열 및 판매 상태
                </label>
                <select
                  id="modal-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProductStatus)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold focus:border-indigo-500 focus:outline-none"
                >
                  <option value="ACTIVE">🟢 판매중 (ACTIVE)</option>
                  <option value="OUT_OF_STOCK">🟠 품절 (OUT_OF_STOCK)</option>
                  <option value="HIDDEN">⚪ 숨김 (HIDDEN)</option>
                  <option value="DISCONTINUED">🔴 단종 (DISCONTINUED)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. 가격 및 재고 섹션 */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5" /> 가격 및 재고 관리
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="modal-regularPrice" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  정가 (원) <span className="text-rose-500">*</span>
                </label>
                <input
                  id="modal-regularPrice"
                  type="number"
                  min="0"
                  step="1000"
                  required
                  value={regularPrice}
                  onChange={(e) => setRegularPrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="modal-salePrice" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  판매가 (원) <span className="text-rose-500">*</span>
                </label>
                <input
                  id="modal-salePrice"
                  type="number"
                  min="0"
                  step="1000"
                  required
                  value={salePrice}
                  onChange={(e) => setSalePrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-indigo-600 dark:text-indigo-400 focus:border-indigo-500 focus:outline-none"
                />
                {calculatedDiscountRate > 0 && (
                  <span className="text-xs font-black text-rose-500 mt-1 block">
                    {calculatedDiscountRate}% 할인 적용
                  </span>
                )}
              </div>

              <div>
                <label htmlFor="modal-stockQuantity" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  재고 수량 <span className="text-rose-500">*</span>
                </label>
                <input
                  id="modal-stockQuantity"
                  type="number"
                  min="0"
                  required
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="modal-shippingFee" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  개별 배송비 (0원=기본정책)
                </label>
                <input
                  id="modal-shippingFee"
                  type="number"
                  min="0"
                  step="500"
                  value={shippingFee}
                  onChange={(e) => setShippingFee(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="modal-taxType" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  과세 구분
                </label>
                <select
                  id="modal-taxType"
                  value={taxType}
                  onChange={(e) => setTaxType(e.target.value as ProductTaxType)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="TAXABLE">과세 상품 (10% 부가세)</option>
                  <option value="FREE">면세 상품</option>
                  <option value="ZERO">영세율</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. 대표 이미지 업로드 섹션 */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" /> 대표 썸네일 이미지
            </h3>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-24 h-24 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                {coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverImageUrl}
                    alt="미리보기"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-8 h-8 text-slate-300" />
                )}
              </div>

              <div className="flex-1 w-full space-y-2">
                <input
                  type="text"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  placeholder="이미지 직접 URL 입력 (https://...)"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:border-indigo-500 focus:outline-none"
                />

                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploading ? '업로드 중...' : '파일에서 이미지 업로드'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[11px] text-slate-400">
                    JPG, PNG, WebP (최대 10MB)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 하단 모달 액션 버튼 */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isPending || isUploading}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              {isPending ? (
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isPending ? '저장 중...' : isEditMode ? '수정 내용 저장' : '상품 등록 완료'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
