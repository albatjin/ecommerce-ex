'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  Truck,
  CreditCard,
  ShoppingBag,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Box,
} from 'lucide-react';
import type { OrderDetailDTO } from '@/core/application/order/dtos/OrderDTO';
import { STATUS_STYLE_MAP } from './OrderListViewer';

interface OrderDetailViewerProps {
  order: OrderDetailDTO;
}

const ORDER_STEPS = [
  { key: 'PAID', label: '결제 완료', icon: CheckCircle2 },
  { key: 'PREPARING', label: '상품 준비 중', icon: Box },
  { key: 'SHIPPING', label: '배송 중', icon: Truck },
  { key: 'DELIVERED', label: '배송 완료', icon: CheckCircle2 },
];

export function OrderDetailViewer({ order }: OrderDetailViewerProps) {
  const currentStepIndex = ORDER_STEPS.findIndex((s) => s.key === order.status);
  const isCancelled =
    order.status === 'CANCELLED' ||
    order.status === 'CANCEL_REQUESTED' ||
    order.status === 'RETURNED' ||
    order.status === 'RETURN_REQUESTED';

  const orderDate = new Date(order.createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const style = STATUS_STYLE_MAP[order.status] || STATUS_STYLE_MAP.PAID;

  return (
    <div className="space-y-6">
      {/* 1. 상단 브레드크럼 & 헤더 */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <Link
            href="/my-page/orders"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>주문 목록으로 돌아가기</span>
          </Link>
          <span
            className={`px-3 py-1 rounded-full text-xs font-extrabold border ${style.bg} ${style.text} ${style.border}`}
          >
            {order.statusLabel}
          </span>
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-xs text-slate-400">주문일시: {orderDate}</span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
              {order.orderNumber}
            </h1>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400">총 결제금액</span>
            <div className="text-xl font-black text-blue-600 dark:text-blue-400">
              {order.totalPaidAmount.toLocaleString()}원
            </div>
          </div>
        </div>

        {/* 2. 배송 상태 진행 바 (취소/반품이 아닐 경우) */}
        {!isCancelled && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="grid grid-cols-4 gap-2 relative">
              {ORDER_STEPS.map((step, idx) => {
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;
                const Icon = step.icon;

                return (
                  <div key={step.key} className="text-center space-y-2">
                    <div
                      className={`w-10 h-10 mx-auto rounded-2xl flex items-center justify-center transition-all ${
                        isCurrent
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-105'
                          : isPassed
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-400'
                          : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-xs font-bold block ${
                        isCurrent
                          ? 'text-blue-600 dark:text-blue-400'
                          : isPassed
                          ? 'text-slate-800 dark:text-slate-200'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 배송 송장 번호 안내 */}
            {order.tracking?.number && (
              <div className="mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs flex items-center justify-between">
                <span className="text-slate-500">
                  배송 정보: {order.tracking.company || 'CJ대한통운'}
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  송장번호: {order.tracking.number}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. 주문 상품 목록 */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <ShoppingBag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
            주문 품목 ({order.items.length}개)
          </h2>
        </div>

        <div className="space-y-3">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/60"
            >
              <div className="w-16 h-16 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 border border-slate-200/60 dark:border-slate-700 flex items-center justify-center">
                {item.productImageUrl ? (
                  <img
                    src={item.productImageUrl}
                    alt={item.productName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ShoppingBag className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-0.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {item.productName}
                </h3>
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

      {/* 4. 배송지 & 결제 내역 2열 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 배송지 정보 */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              배송지 정보
            </h2>
          </div>
          <div className="space-y-1.5 text-sm">
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
                요청사항: {order.shippingAddress.message}
              </p>
            )}
          </div>
        </div>

        {/* 결제 영수증 */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              결제 내역
            </h2>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>상품 금액</span>
              <span>{order.totalProductAmount.toLocaleString()}원</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>쿠폰 할인</span>
                <span>-{order.discountAmount.toLocaleString()}원</span>
              </div>
            )}
            {order.pointUsed > 0 && (
              <div className="flex justify-between text-amber-600">
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
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline font-bold text-sm text-slate-900 dark:text-white">
              <span>결제 수단: {order.payment.methodLabel}</span>
              <span className="text-base text-blue-600 dark:text-blue-400">
                {order.totalPaidAmount.toLocaleString()}원
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

