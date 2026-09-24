'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  PackageCheck,
  ChevronRight,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import type { OrderListItemDTO } from '@/core/application/order/dtos/OrderDTO';
import type { OrderStatus } from '@/shared/types/database.types';

interface OrderListViewerProps {
  initialOrders: OrderListItemDTO[];
  totalCount: number;
}

type FilterTab = 'ALL' | 'PAID' | 'PREPARING' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED';

const TABS: { id: FilterTab; label: string }[] = [
  { id: 'ALL', label: '전체' },
  { id: 'PAID', label: '결제완료' },
  { id: 'PREPARING', label: '상품준비' },
  { id: 'SHIPPING', label: '배송중' },
  { id: 'DELIVERED', label: '배송완료' },
  { id: 'CANCELLED', label: '취소/반품' },
];

export const STATUS_STYLE_MAP: Record<OrderStatus, { bg: string; text: string; border: string }> = {
  PAYMENT_PENDING: {
    bg: 'bg-amber-50 dark:bg-amber-950/60',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-900',
  },
  PAID: {
    bg: 'bg-blue-50 dark:bg-blue-950/60',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-900',
  },
  PREPARING: {
    bg: 'bg-amber-50 dark:bg-amber-950/60',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-900',
  },
  SHIPPING: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/60',
    text: 'text-indigo-700 dark:text-indigo-400',
    border: 'border-indigo-200 dark:border-indigo-900',
  },
  DELIVERED: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-900',
  },
  CANCEL_REQUESTED: {
    bg: 'bg-rose-50 dark:bg-rose-950/60',
    text: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-900',
  },
  CANCELLED: {
    bg: 'bg-rose-50 dark:bg-rose-950/60',
    text: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-900',
  },
  RETURN_REQUESTED: {
    bg: 'bg-rose-50 dark:bg-rose-950/60',
    text: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-900',
  },
  RETURNED: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-700',
  },
};

export function OrderListViewer({
  initialOrders,
  totalCount,
}: OrderListViewerProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');

  const filteredOrders = useMemo(() => {
    if (activeTab === 'ALL') return initialOrders;
    if (activeTab === 'CANCELLED') {
      return initialOrders.filter(
        (o) =>
          o.status === 'CANCELLED' ||
          o.status === 'CANCEL_REQUESTED' ||
          o.status === 'RETURNED' ||
          o.status === 'RETURN_REQUESTED'
      );
    }
    return initialOrders.filter((o) => o.status === activeTab);
  }, [initialOrders, activeTab]);

  return (
    <div className="space-y-6">
      {/* 1. 상단 타이틀 & 탭 필터 */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h1 className="text-lg font-black text-slate-900 dark:text-white">
              주문 / 배송 조회
            </h1>
          </div>
          <span className="text-xs text-slate-500">
            총 <span className="font-bold text-slate-900 dark:text-white">{totalCount}</span>건
          </span>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. 주문 내역 목록 */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <ShoppingBag className="w-8 h-8 opacity-70" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              해당 상태의 주문 내역이 없습니다.
            </h2>
            <p className="text-xs text-slate-500">
              최신 트렌드 상품을 둘러보고 마음에 드는 상품을 주문해 보세요.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center justify-center py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
          >
            상품 둘러보기
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const style = STATUS_STYLE_MAP[order.status] || STATUS_STYLE_MAP.PAID;
            const orderDate = new Date(order.createdAt).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });

            return (
              <div
                key={order.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-4"
              >
                {/* 카드 상단: 날짜 / 주문번호 / 상태 뱃지 */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">{orderDate}</span>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <span className="font-mono text-slate-500">{order.orderNumber}</span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-bold border ${style.bg} ${style.text} ${style.border}`}
                  >
                    {order.statusLabel}
                  </span>
                </div>

                {/* 카드 중단: 상품 정보 & 금액 */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200/60 dark:border-slate-700 flex items-center justify-center">
                    {order.firstItemImageUrl ? (
                      <img
                        src={order.firstItemImageUrl}
                        alt={order.orderName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ShoppingBag className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                      {order.orderName}
                    </h3>
                    <p className="text-xs text-slate-400">
                      총 {order.itemCount}개 · {order.paymentMethodLabel}
                    </p>
                    <div className="text-base font-black text-slate-900 dark:text-white">
                      {order.totalPaidAmount.toLocaleString()}원
                    </div>
                  </div>
                  <Link
                    href={`/my-page/orders/${order.id}`}
                    className="hidden sm:inline-flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200/80 dark:border-slate-700 transition-all shrink-0"
                  >
                    <span>주문 상세</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>
                </div>

                {/* 모바일용 주문 상세 링크 */}
                <div className="sm:hidden pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Link
                    href={`/my-page/orders/${order.id}`}
                    className="w-full flex items-center justify-center gap-1 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <span>주문 상세 내역 확인하기</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

