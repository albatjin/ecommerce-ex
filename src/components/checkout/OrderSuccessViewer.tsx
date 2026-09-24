'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Copy,
  Check,
  ShoppingBag,
  CreditCard,
  Truck,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import type { OrderDetailDTO } from '@/core/application/order/dtos/OrderDTO';

interface OrderSuccessViewerProps {
  order: OrderDetailDTO;
}

export function OrderSuccessViewer({ order }: OrderSuccessViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyOrderNumber = async () => {
    try {
      await navigator.clipboard.writeText(order.orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 복사 실패 방어
    }
  };

  const formattedDate = new Date(order.createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="container-custom py-10 sm:py-16 max-w-4xl mx-auto space-y-8">
      {/* 1. 상단 축하 배너 */}
      <div className="text-center space-y-4 p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950/40 dark:to-slate-900 border border-emerald-100 dark:border-emerald-900/60 shadow-sm">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Order Complete
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            주문이 정상적으로 완료되었습니다!
          </h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto pt-1">
            소중한 주문이 안전하게 접수되었습니다. 결제 및 배송 준비가 완료되는 대로 신속히 보내드리겠습니다.
          </p>
        </div>

        {/* 주문 번호 복사 뱃지 */}
        <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs">
          <span className="text-xs text-slate-400">주문번호</span>
          <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
            {order.orderNumber}
          </span>
          <button
            type="button"
            onClick={handleCopyOrderNumber}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400 transition-colors"
            title="주문번호 복사"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* 2. 주문 정보 2컬럼 레이아웃 */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* 좌측: 주문 상품 목록 (7/12) */}
        <div className="md:col-span-7 space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  주문 상품 ({order.items.length}건)
                </h2>
              </div>
              <span className="text-xs text-slate-400">{formattedDate}</span>
            </div>

            <div className="space-y-3">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/60"
                >
                  <div className="w-16 h-16 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 border border-slate-200/60 dark:border-slate-700">
                    {item.productImageUrl ? (
                      <img
                        src={item.productImageUrl}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                        No Img
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {item.productName}
                    </p>
                    {item.variantName && (
                      <p className="text-xs text-slate-500">{item.variantName}</p>
                    )}
                    <p className="text-xs text-slate-400">
                      {item.quantity}개 / 개당 {item.unitPrice.toLocaleString()}원
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      {item.totalPrice.toLocaleString()}원
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 배송지 정보 카드 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                배송지 정보
              </h2>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <span>{order.shippingAddress.recipientName}</span>
                <span className="text-xs text-slate-400 font-normal">
                  ({order.shippingAddress.recipientPhone})
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                [{order.shippingAddress.zipcode}] {order.shippingAddress.address}
              </p>
              {order.shippingAddress.message && (
                <p className="text-xs text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                  배송 요청사항: {order.shippingAddress.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 우측: 결제 금액 및 상태 요약 (5/12) */}
        <div className="md:col-span-5 space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                결제 영수증
              </h2>
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>상품 합계</span>
                <span>{order.totalProductAmount.toLocaleString()}원</span>
              </div>

              {order.discountAmount > 0 && (
                <div className="flex justify-between text-rose-600 font-medium">
                  <span>쿠폰 할인</span>
                  <span>-{order.discountAmount.toLocaleString()}원</span>
                </div>
              )}

              {order.pointUsed > 0 && (
                <div className="flex justify-between text-amber-600 font-medium">
                  <span>적립금 사용</span>
                  <span>-{order.pointUsed.toLocaleString()}P</span>
                </div>
              )}

              <div className="flex justify-between text-slate-500">
                <span>배송비</span>
                <span>
                  {order.shippingFee === 0 ? '무료' : `${order.shippingFee.toLocaleString()}원`}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline">
                <span className="font-extrabold text-slate-900 dark:text-white">
                  최종 결제 금액
                </span>
                <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                  {order.totalPaidAmount.toLocaleString()}원
                </span>
              </div>
            </div>

            {/* 결제 수단 및 승인 정보 */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span className="text-slate-400">결제 수단</span>
                <span className="font-bold">{order.payment.methodLabel}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span className="text-slate-400">주문 상태</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {order.statusLabel}
                </span>
              </div>
              {order.payment.paidAt && (
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400">승인 일시</span>
                  <span>
                    {new Date(order.payment.paidAt).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>안전한 전자상거래 표준 영수증이 발행되었습니다.</span>
            </div>
          </div>

          {/* 하단 액션 버튼 */}
          <div className="space-y-3">
            <Link
              href="/my-page/orders"
              className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <span>주문 내역 확인하기</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/products"
              className="w-full flex items-center justify-center py-3.5 px-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm transition-all text-center"
            >
              계속 쇼핑하기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

