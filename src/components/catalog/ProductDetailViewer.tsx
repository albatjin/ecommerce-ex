'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  CreditCard,
  Truck,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Minus,
  Plus,
  Tag,
  Star,
  Check,
} from 'lucide-react';
import type {
  ProductDetailDTO,
  ProductVariantDetailDTO,
} from '@/core/application/catalog/dtos/ProductDetailDTO';
import { useCart } from '@/components/cart/CartContext';

interface ProductDetailViewerProps {
  product: ProductDetailDTO;
  onAddToCart?: (productId: string, variantId?: string, quantity?: number) => void;
  onBuyNow?: (productId: string, variantId?: string, quantity?: number) => void;
}

export function ProductDetailViewer({
  product,
  onAddToCart,
  onBuyNow,
}: ProductDetailViewerProps) {
  // 1. 이미지 갤러리 상태
  const allImages = [
    ...(product.coverImageUrl ? [product.coverImageUrl] : []),
    ...product.additionalImages,
  ];
  const [selectedImage, setSelectedImage] = useState<string>(
    allImages[0] || ''
  );

  // 2. 옵션/SKU 선택 상태
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantDetailDTO | null>(
    product.variants.length > 0 ? product.variants[0] : null
  );

  // 3. 구매 수량 상태
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'shipping'>('desc');
  const [addedAlert, setAddedAlert] = useState(false);
  const { addToCart } = useCart();
  
  let router: ReturnType<typeof useRouter> | null = null;
  try {
    router = useRouter();
  } catch {
    // Router context fallback
  }

  // 재고 및 주문 가능 여부
  const currentStock = selectedVariant
    ? selectedVariant.stockQuantity
    : product.stockQuantity;
  const isOutOfStock =
    !product.isOrderable ||
    product.status === 'OUT_OF_STOCK' ||
    (selectedVariant ? !selectedVariant.isAvailable : currentStock <= 0);

  const maxPurchasable = Math.min(product.maxOrderQuantity, Math.max(1, currentStock));

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (next > maxPurchasable) return maxPurchasable;
      return next;
    });
  };

  // 총 금액 계산 (상품 할인가 + 옵션 추가금) * 수량
  const unitPrice = product.salePrice + (selectedVariant?.additionalPrice || 0);
  const totalPrice = unitPrice * quantity;
  const rewardPointsEarn = Math.floor(totalPrice * 0.01); // 1% 적립금

  const handleAddToCart = async () => {
    if (isOutOfStock) return;
    if (onAddToCart) {
      onAddToCart(product.id, selectedVariant?.id, quantity);
    }
    await addToCart(
      {
        productId: product.id,
        variantId: selectedVariant?.id ?? null,
        productName: product.nameKo,
        variantName: selectedVariant?.variantName ?? null,
        price: unitPrice,
        quantity,
        coverImageUrl: selectedImage || null,
        shippingFee: product.shippingFee,
      },
      true
    );
    setAddedAlert(true);
    setTimeout(() => setAddedAlert(false), 3000);
  };

  const handleBuyNow = async () => {
    if (isOutOfStock) return;
    if (onBuyNow) {
      onBuyNow(product.id, selectedVariant?.id, quantity);
      return;
    }
    const success = await addToCart(
      {
        productId: product.id,
        variantId: selectedVariant?.id ?? null,
        productName: product.nameKo,
        variantName: selectedVariant?.variantName ?? null,
        price: unitPrice,
        quantity,
        coverImageUrl: selectedImage || null,
        shippingFee: product.shippingFee,
      },
      false
    );
    if (success) {
      if (router) {
        router.push('/checkout');
      } else if (typeof window !== 'undefined') {
        window.location.href = '/checkout';
      }
    }
  };

  return (
    <div className="space-y-12">
      {/* 장바구니 담기 성공 플로팅 알림 */}
      {addedAlert && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-200 border border-slate-700">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold">장바구니에 상품을 담았습니다.</p>
            <Link href="/cart" className="text-xs text-blue-400 hover:underline">
              장바구니 바로가기 →
            </Link>
          </div>
        </div>
      )}

      {/* 상단 2열: 이미지 갤러리 + 상품 옵션/구매 패널 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14 items-start">
        {/* 1. 좌측 이미지 갤러리 (5/12) */}
        <div className="lg:col-span-6 space-y-4">
          {/* 메인 뷰포트 */}
          <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            {selectedImage ? (
              <img
                src={selectedImage}
                alt={product.nameKo}
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                <ShoppingBag className="w-16 h-16 opacity-30 mb-2" />
                <span className="text-sm font-medium">이미지 준비중</span>
              </div>
            )}

            {product.discountRate > 0 && (
              <span className="absolute top-4 left-4 bg-red-600 text-white font-extrabold text-sm px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                {product.discountRate}% OFF
              </span>
            )}
          </div>

          {/* 썸네일 리스트 */}
          {allImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {allImages.map((imgUrl, index) => {
                const isSelected = selectedImage === imgUrl;
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedImage(imgUrl)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 ring-2 ring-blue-500/30'
                        : 'border-transparent hover:border-slate-300 dark:hover:border-slate-700 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`미리보기 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. 우측 상세 정보 및 주문 패널 (7/12) */}
        <div className="lg:col-span-6 space-y-6">
          {/* 브랜드 & 리뷰 평점 */}
          <div className="flex items-center justify-between">
            {product.brandName && (
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 tracking-wider uppercase bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-md">
                {product.brandName}
              </span>
            )}
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <div className="flex items-center text-amber-400">
                <Star className="w-4 h-4 fill-amber-400" />
                <span className="font-bold text-slate-800 dark:text-slate-200 ml-1">4.9</span>
              </div>
              <span>·</span>
              <span className="hover:underline cursor-pointer">리뷰 128건</span>
            </div>
          </div>

          {/* 상품명 */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
              {product.nameKo}
            </h1>
            {product.nameEn && (
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                {product.nameEn}
              </p>
            )}
            <p className="text-xs text-slate-400 mt-1.5">
              상품코드: <span className="font-mono text-slate-500">{product.productCode}</span>
            </p>
          </div>

          {/* 가격 영역 */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 space-y-2">
            <div className="flex items-baseline gap-3">
              {product.discountRate > 0 && (
                <span className="text-base text-slate-400 line-through">
                  {product.regularPrice.toLocaleString()}원
                </span>
              )}
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {product.salePrice.toLocaleString()}
                </span>
                <span className="text-base font-bold text-slate-700 dark:text-slate-300">원</span>
              </div>
            </div>

            {/* 적립금 안내 */}
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-800">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>구매 시 <strong className="text-blue-600 dark:text-blue-400">{rewardPointsEarn.toLocaleString()}P</strong> (1%) 적립 혜택</span>
            </div>
          </div>

          {/* 배송 정보 */}
          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 border-y border-slate-100 dark:border-slate-800 py-3.5">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-slate-400" />
              <span>
                배송비:{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  {product.shippingFee === 0 ? '무료배송' : `${product.shippingFee.toLocaleString()}원`}
                </strong>
                {' '}(CJ대한통운 익일 출고)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-400" />
              <span>100% 정품 보증 · 안전 포장 직배송</span>
            </div>
          </div>

          {/* 옵션 / SKU 선택기 */}
          {product.variants.length > 0 && (
            <div className="space-y-2">
              <label htmlFor="variant-select" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                옵션 선택 (필수)
              </label>
              <select
                id="variant-select"
                value={selectedVariant?.id || ''}
                onChange={(e) => {
                  const found = product.variants.find((v) => v.id === e.target.value) || null;
                  setSelectedVariant(found);
                  setQuantity(1);
                }}
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {product.variants.map((variant) => (
                  <option
                    key={variant.id}
                    value={variant.id}
                    disabled={!variant.isAvailable}
                  >
                    {variant.variantName}
                    {variant.additionalPrice > 0 ? ` (+${variant.additionalPrice.toLocaleString()}원)` : ''}
                    {!variant.isAvailable ? ' - [품절]' : ` (재고: ${variant.stockQuantity}개)`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 수량 선택 및 총 금액 */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">수량 선택</span>
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1 || isOutOfStock}
                  className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40"
                  aria-label="수량 감소"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center text-sm font-bold text-slate-900 dark:text-white">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= maxPurchasable || isOutOfStock}
                  className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40"
                  aria-label="수량 증가"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 최종 결제 금액 */}
            <div className="flex items-baseline justify-between pt-3 border-t border-slate-200/60 dark:border-slate-800">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">총 결제금액</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                  {totalPrice.toLocaleString()}
                </span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">원</span>
              </div>
            </div>
          </div>

          {/* 구매 및 장바구니 버튼 그룹 */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleAddToCart}
              className="py-4 px-4 rounded-xl border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 font-bold text-sm sm:text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>장바구니 담기</span>
            </button>

            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleBuyNow}
              className="py-4 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base transition-all shadow-md shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              <CreditCard className="w-5 h-5" />
              <span>{isOutOfStock ? '품절된 상품' : '바로 구매하기'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 하단 탭 영역: 상품 상세 설명 / 배송 및 교환 안내 */}
      <div className="border-t border-slate-200 dark:border-slate-800 pt-10">
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-8">
          <button
            type="button"
            onClick={() => setActiveTab('desc')}
            className={`pb-4 text-base font-bold transition-colors cursor-pointer border-b-2 -mb-px ${
              activeTab === 'desc'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            상품 상세 정보
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('shipping')}
            className={`pb-4 text-base font-bold transition-colors cursor-pointer border-b-2 -mb-px ${
              activeTab === 'shipping'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            배송 / 교환 / 반품 안내
          </button>
        </div>

        <div className="py-8">
          {activeTab === 'desc' ? (
            <div className="prose dark:prose-invert max-w-none space-y-6">
              <div className="bg-slate-50 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  상품 설명
                </h3>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {product.description || '상세한 상품 설명이 곧 등록될 예정입니다.'}
                </p>
              </div>

              {/* 추가 이미지들 노출 */}
              {product.additionalImages.length > 0 && (
                <div className="space-y-4 pt-4">
                  {product.additionalImages.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={`${product.nameKo} 상세 이미지 ${i + 1}`}
                      className="rounded-2xl w-full object-cover max-h-[600px]"
                      loading="lazy"
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-600 dark:text-slate-400">
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <Truck className="w-5 h-5 text-blue-600" />
                  <h4>배송 안내</h4>
                </div>
                <ul className="list-disc pl-5 space-y-1.5 text-xs leading-relaxed">
                  <li>평일 오후 2시 이전 결제 완료 건은 당일 출고됩니다.</li>
                  <li>기본 배송비: 3,000원 (50,000원 이상 구매 시 무료배송)</li>
                  <li>제주 및 도서산간 지역은 추가 배송비 3,000원이 부과됩니다.</li>
                </ul>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <RotateCcw className="w-5 h-5 text-blue-600" />
                  <h4>교환 및 반품 안내</h4>
                </div>
                <ul className="list-disc pl-5 space-y-1.5 text-xs leading-relaxed">
                  <li>상품 수령일로부터 7일 이내 교환/반품 접수가 가능합니다.</li>
                  <li>단순 변심으로 인한 반품 왕복 배송비: 6,000원</li>
                  <li>상품 훼손, 착용 흔적, 라벨 제거 시 교환/반품이 제한될 수 있습니다.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

