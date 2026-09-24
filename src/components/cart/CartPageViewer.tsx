'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  CheckSquare,
  Square,
  ShieldCheck,
  CreditCard,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useCart } from './CartContext';
import { FreeShippingGauge } from './FreeShippingGauge';

export function CartPageViewer() {
  const {
    cart,
    isPending,
    updateQuantity,
    removeItem,
    toggleItem,
    clearCart,
  } = useCart();
  const router = useRouter();

  const items = cart?.items || [];
  const itemCount = cart?.totalItemCount || 0;
  const selectedItems = items.filter((i) => i.selected);
  const selectedCount = selectedItems.reduce((acc, i) => acc + i.quantity, 0);
  const isAllSelected = items.length > 0 && items.every((i) => i.selected);

  const productTotal = cart?.totalProductAmount || 0;
  const shippingFee = cart?.totalShippingFee || 0;
  const totalPayment = cart?.totalPaymentAmount || 0;
  const estimatedPoints = Math.floor(productTotal * 0.01);

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      alert('주문하실 상품을 하나 이상 선택해 주세요.');
      return;
    }
    router.push('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="container-custom py-16">
        <div className="max-w-md mx-auto text-center p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <ShoppingBag className="w-10 h-10 opacity-60" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
              장바구니가 비어 있습니다
            </h1>
            <p className="text-sm text-slate-500">
              다양한 프리미엄 상품을 둘러보고 마음에 드는 상품을 담아보세요!
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all"
          >
            <span>인기 상품 둘러보기</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-8 sm:py-12">
      {/* 1. 상단 타이틀 */}
      <div className="flex items-baseline justify-between mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            장바구니
          </h1>
          <span className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-bold">
            {itemCount}개
          </span>
        </div>
      </div>

      {/* 2. 본문 2컬럼 레이아웃 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* 좌측 품목 리스트 (8/12) */}
        <div className="lg:col-span-8 space-y-4">
          {/* 툴바: 전체선택 / 선택삭제 / 전체비우기 */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs sm:text-sm">
            <button
              type="button"
              disabled={isPending}
              onClick={() => toggleItem({ selectAll: !isAllSelected })}
              className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 cursor-pointer disabled:opacity-50"
            >
              {isAllSelected ? (
                <CheckSquare className="w-4 h-4 text-blue-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>전체 선택 ({selectedItems.length}/{items.length})</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isPending || selectedItems.length === 0}
                onClick={() => removeItem({ selectedOnly: true })}
                className="text-slate-500 hover:text-red-500 font-medium transition-colors cursor-pointer disabled:opacity-40"
              >
                선택 삭제
              </button>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <button
                type="button"
                disabled={isPending}
                onClick={() => clearCart()}
                className="text-slate-500 hover:text-red-500 font-medium transition-colors cursor-pointer disabled:opacity-40"
              >
                장바구니 비우기
              </button>
            </div>
          </div>

          {/* 품목 카드 리스트 */}
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
              >
                {/* 체크박스 & 상품 정보 */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => toggleItem({ itemId: item.id })}
                    className="mt-1 text-slate-400 hover:text-blue-600 cursor-pointer disabled:opacity-50 shrink-0"
                    aria-label={item.selected ? '선택 해제' : '선택'}
                  >
                    {item.selected ? (
                      <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </button>

                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200/60 dark:border-slate-800 relative">
                    {item.coverImageUrl ? (
                      <img
                        src={item.coverImageUrl}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                        No Image
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <Link
                      href={`/products/${item.productId}`}
                      className="font-bold text-sm sm:text-base text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-1"
                    >
                      {item.productName}
                    </Link>

                    {item.variantName && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        옵션: <span className="font-medium text-slate-700 dark:text-slate-300">{item.variantName}</span>
                      </p>
                    )}

                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      단가: {item.price.toLocaleString()}원
                    </p>
                  </div>
                </div>

                {/* 수량 조절기 & 소계 & 삭제 */}
                <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  {/* 수량 스텝퍼 */}
                  <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 overflow-hidden">
                    <button
                      type="button"
                      disabled={isPending || item.quantity <= 1}
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                      aria-label="수량 감소"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 sm:w-10 text-center text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      disabled={isPending || item.quantity >= 99}
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                      aria-label="수량 증가"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* 소계 금액 */}
                  <div className="text-right min-w-[90px]">
                    <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      {item.subtotal.toLocaleString()}원
                    </span>
                  </div>

                  {/* 삭제 버튼 */}
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => removeItem({ itemId: item.id })}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer disabled:opacity-50"
                    aria-label="품목 삭제"
                  >
                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 우측 결제 요약 패널 (4/12) */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
          {/* 무료배송 게이지 */}
          <FreeShippingGauge currentAmount={productTotal} />

          {/* 최종 결제 정보 카드 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              결제 금액 요약
            </h2>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>선택 품목 합계 ({selectedCount}개)</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {productTotal.toLocaleString()}원
                </span>
              </div>

              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>배송비</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {shippingFee === 0 ? (
                    <span className="text-blue-600 dark:text-blue-400 font-bold">무료</span>
                  ) : (
                    `${shippingFee.toLocaleString()}원`
                  )}
                </span>
              </div>

              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>할인 / 혜택</span>
                <span className="font-semibold text-slate-900 dark:text-white">0원</span>
              </div>

              {/* 적립 예정 포인트 */}
              <div className="pt-2 flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 border-t border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  구매 적립 예정 포인트
                </span>
                <span className="font-bold">+{estimatedPoints.toLocaleString()}P (1%)</span>
              </div>

              {/* 최종 결제 금액 */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-baseline">
                <span className="text-base font-extrabold text-slate-900 dark:text-white">
                  총 결제예정금액
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
                    {totalPayment.toLocaleString()}
                  </span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">원</span>
                </div>
              </div>
            </div>

            {/* 주문하기 버튼 */}
            <button
              type="button"
              disabled={isPending || selectedItems.length === 0}
              onClick={handleCheckout}
              className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-blue-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              <CreditCard className="w-5 h-5" />
              <span>
                {selectedItems.length === 0
                  ? '상품을 선택해 주세요'
                  : `${selectedCount}개 상품 주문하기`}
              </span>
            </button>

            {/* 안심 보증 배지 */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>100% 정품 보증 및 안전 결제 암호화</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>수령 후 7일 이내 안심 반품 및 교환</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

