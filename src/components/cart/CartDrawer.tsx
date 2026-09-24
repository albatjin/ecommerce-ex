'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  CreditCard,
} from 'lucide-react';
import { useCart } from './CartContext';
import { FreeShippingGauge } from './FreeShippingGauge';

export function CartDrawer() {
  const {
    cart,
    isOpen,
    isPending,
    closeDrawer,
    updateQuantity,
    removeItem,
  } = useCart();
  const router = useRouter();
  const drawerRef = useRef<HTMLDivElement>(null);

  // ESC 키 누르면 드로어 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeDrawer]);

  // 드로어 열렸을 때 배경 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const items = cart?.items || [];
  const itemCount = cart?.totalItemCount || 0;
  const productTotal = cart?.totalProductAmount || 0;
  const shippingFee = cart?.totalShippingFee || 0;
  const totalPayment = cart?.totalPaymentAmount || 0;

  const handleCheckoutClick = () => {
    closeDrawer();
    router.push('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" aria-modal="true" role="dialog">
      {/* 1. 배경 백드롭 오버레이 */}
      <div
        onClick={closeDrawer}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* 2. 우측 슬라이드오버 패널 */}
      <div
        ref={drawerRef}
        className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col z-10 transition-transform animate-in slide-in-from-right duration-300 border-l border-slate-200 dark:border-slate-800"
      >
        {/* 상단 헤더 */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
              장바구니
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold">
              {itemCount}개
            </span>
          </div>

          <button
            type="button"
            onClick={closeDrawer}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 무료배송 게이지 안내 */}
        <div className="px-4 sm:px-5 pt-4">
          <FreeShippingGauge currentAmount={productTotal} />
        </div>

        {/* 본문 품목 리스트 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <ShoppingBag className="w-8 h-8 opacity-40" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                  장바구니가 비어 있습니다.
                </p>
                <p className="text-xs text-slate-500">
                  마음에 드는 상품을 장바구니에 담아보세요!
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  closeDrawer();
                  router.push('/products');
                }}
                className="mt-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition-all shadow-sm"
              >
                쇼핑 계속하기
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80 flex gap-3.5 items-start transition-all"
              >
                {/* 썸네일 이미지 */}
                <div className="w-18 h-18 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 relative border border-slate-200/60 dark:border-slate-700">
                  {item.coverImageUrl ? (
                    <img
                      src={item.coverImageUrl}
                      alt={item.productName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                      No Img
                    </div>
                  )}
                </div>

                {/* 상품 정보 및 수량 제어 */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                      {item.productName}
                    </h3>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => removeItem({ itemId: item.id })}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1 cursor-pointer disabled:opacity-50"
                      aria-label="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {item.variantName && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      옵션: {item.variantName}
                    </p>
                  )}

                  <div className="pt-2 flex items-center justify-between">
                    {/* 수량 조절 버튼 */}
                    <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 overflow-hidden">
                      <button
                        type="button"
                        disabled={isPending || item.quantity <= 1}
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                        aria-label="수량 감소"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-7 text-center text-xs font-bold text-slate-800 dark:text-slate-200">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        disabled={isPending || item.quantity >= 99}
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                        aria-label="수량 증가"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* 소계 금액 */}
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                      {item.subtotal.toLocaleString()}원
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 하단 요약 및 주문 버튼 영역 */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3.5">
            {/* 금액 요약 */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>총 상품금액</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {productTotal.toLocaleString()}원
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>배송비</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {shippingFee === 0 ? '무료' : `${shippingFee.toLocaleString()}원`}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex justify-between items-baseline">
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                  결제 예정금액
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-black text-blue-600 dark:text-blue-400">
                    {totalPayment.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">원</span>
                </div>
              </div>
            </div>

            {/* 이동 버튼들 */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                href="/cart"
                onClick={closeDrawer}
                className="py-3 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs sm:text-sm text-center flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>장바구니 보기</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <button
                type="button"
                onClick={handleCheckoutClick}
                className="py-3 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm text-center flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-500/20 cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>주문하기</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
