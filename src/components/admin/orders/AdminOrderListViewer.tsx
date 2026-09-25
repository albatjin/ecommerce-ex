'use client';

import { useState, useTransition, useMemo } from 'react';
import {
  ShoppingBag,
  Search,
  Truck,
  CheckCircle2,
  Clock,
  Package,
  RotateCcw,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  MapPin,
  ExternalLink,
  Edit2,
  ArrowRight,
} from 'lucide-react';
import type { OrderListItemDTO } from '@/core/application/order/dtos/OrderDTO';
import type { OrderStatus } from '@/shared/types/database.types';
import { updateOrderDeliveryAction } from '@/app/actions/order.actions';
import { ShippingTrackingModal } from './ShippingTrackingModal';

export type OrderFilterTab =
  | 'ALL'
  | 'PAID'
  | 'PREPARING'
  | 'SHIPPING'
  | 'DELIVERED'
  | 'CLAIMS';

interface AdminOrderListViewerProps {
  initialOrders: OrderListItemDTO[];
  totalCount: number;
}

const ORDER_TABS: { id: OrderFilterTab; label: string }[] = [
  { id: 'ALL', label: '전체 주문' },
  { id: 'PAID', label: '결제 완료' },
  { id: 'PREPARING', label: '배송 준비 중' },
  { id: 'SHIPPING', label: '배송 중' },
  { id: 'DELIVERED', label: '배송 완료' },
  { id: 'CLAIMS', label: '취소/반품' },
];

export function AdminOrderListViewer({
  initialOrders,
  totalCount,
}: AdminOrderListViewerProps) {
  const [orders, setOrders] = useState<OrderListItemDTO[]>(initialOrders);
  const [activeTab, setActiveTab] = useState<OrderFilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // 모달 상태
  const [trackingModalOrder, setTrackingModalOrder] = useState<OrderListItemDTO | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 피드백 메시지
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [isPending, startTransition] = useTransition();

  // 통계 계산
  const paidCount = orders.filter((o) => o.status === 'PAID').length;
  const preparingCount = orders.filter((o) => o.status === 'PREPARING').length;
  const shippingCount = orders.filter((o) => o.status === 'SHIPPING').length;
  const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length;
  const claimsCount = orders.filter(
    (o) =>
      o.status === 'CANCEL_REQUESTED' ||
      o.status === 'CANCELLED' ||
      o.status === 'RETURN_REQUESTED' ||
      o.status === 'RETURNED'
  ).length;

  // 필터링 적용 목록
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // 1. 탭 필터
      if (activeTab === 'PAID' && o.status !== 'PAID') return false;
      if (activeTab === 'PREPARING' && o.status !== 'PREPARING') return false;
      if (activeTab === 'SHIPPING' && o.status !== 'SHIPPING') return false;
      if (activeTab === 'DELIVERED' && o.status !== 'DELIVERED') return false;
      if (activeTab === 'CLAIMS') {
        const isClaim =
          o.status === 'CANCEL_REQUESTED' ||
          o.status === 'CANCELLED' ||
          o.status === 'RETURN_REQUESTED' ||
          o.status === 'RETURNED';
        if (!isClaim) return false;
      }

      // 2. 검색어 필터
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNumber = o.orderNumber.toLowerCase().includes(q);
        const matchName = o.orderName.toLowerCase().includes(q);
        const matchRecipient = o.recipientName?.toLowerCase().includes(q);
        const matchTracking = o.trackingNumber?.toLowerCase().includes(q);
        if (!matchNumber && !matchName && !matchRecipient && !matchTracking) {
          return false;
        }
      }

      return true;
    });
  }, [orders, activeTab, searchQuery]);

  // 배송 준비 처리 (PAID -> PREPARING)
  const handleMarkAsPreparing = (order: OrderListItemDTO) => {
    startTransition(async () => {
      const result = await updateOrderDeliveryAction({
        orderId: order.id,
        targetStatus: 'PREPARING',
      });

      if (result.success && result.data) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === order.id
              ? { ...o, status: 'PREPARING', statusLabel: '배송 준비 중' }
              : o
          )
        );
        setFeedback({
          type: 'success',
          text: `주문 [${order.orderNumber}]이(가) '배송 준비 중'으로 변경되었습니다.`,
        });
      } else {
        setFeedback({
          type: 'error',
          text: result.error || '상태 변경 중 오류가 발생했습니다.',
        });
      }
    });
  };

  // 배송 시작 및 송장 등록 모달 열기
  const handleOpenTrackingModal = (order: OrderListItemDTO) => {
    setTrackingModalOrder(order);
  };

  // 배송 시작 및 송장 등록 확정
  const handleConfirmTracking = async (
    trackingCompany: string,
    trackingNumber: string
  ) => {
    if (!trackingModalOrder) return;

    setIsProcessing(true);
    try {
      const result = await updateOrderDeliveryAction({
        orderId: trackingModalOrder.id,
        targetStatus: 'SHIPPING',
        trackingCompany,
        trackingNumber,
      });

      if (result.success && result.data) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === trackingModalOrder.id
              ? {
                  ...o,
                  status: 'SHIPPING',
                  statusLabel: '배송 중',
                  trackingCompany,
                  trackingNumber,
                  shippedAt: new Date().toISOString(),
                }
              : o
          )
        );
        setFeedback({
          type: 'success',
          text: `주문 [${trackingModalOrder.orderNumber}] 송장번호(${trackingCompany} ${trackingNumber}) 등록 및 배송 처리가 완료되었습니다.`,
        });
      } else {
        throw new Error(result.error || '배송 처리 중 오류가 발생했습니다.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // 배송 완료 처리 (SHIPPING -> DELIVERED)
  const handleMarkAsDelivered = (order: OrderListItemDTO) => {
    if (!window.confirm(`주문 [${order.orderNumber}]을(를) 배송 완료 처리하시겠습니까?`)) {
      return;
    }

    startTransition(async () => {
      const result = await updateOrderDeliveryAction({
        orderId: order.id,
        targetStatus: 'DELIVERED',
      });

      if (result.success && result.data) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === order.id
              ? {
                  ...o,
                  status: 'DELIVERED',
                  statusLabel: '배송 완료',
                  deliveredAt: new Date().toISOString(),
                }
              : o
          )
        );
        setFeedback({
          type: 'success',
          text: `주문 [${order.orderNumber}]이(가) '배송 완료' 처리되었습니다.`,
        });
      } else {
        setFeedback({
          type: 'error',
          text: result.error || '배송 완료 처리 중 오류가 발생했습니다.',
        });
      }
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. 상단 타이틀 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            주문 & 배송 통합 관리 (CMS)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            결제 완료된 주문을 조회하고 상품 준비, 송장 번호 등록 및 배송 라이프사이클을 통제합니다.
          </p>
        </div>
      </div>

      {/* 2. 상태별 카운트 요약 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">전체 주문</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
            {orders.length}
            <span className="text-xs font-normal text-slate-400 ml-1">건</span>
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs">
          <span className="text-xs font-semibold text-blue-800 dark:text-blue-300 block">
            결제 완료
          </span>
          <span className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 block">
            {paidCount}
            <span className="text-xs font-normal text-blue-500/70 ml-1">건</span>
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-xs">
          <span className="text-xs font-semibold text-indigo-800 dark:text-indigo-300 block">
            배송 준비 중
          </span>
          <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1 block">
            {preparingCount}
            <span className="text-xs font-normal text-indigo-500/70 ml-1">건</span>
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 shadow-xs">
          <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 block">
            배송 중
          </span>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
            {shippingCount}
            <span className="text-xs font-normal text-amber-500/70 ml-1">건</span>
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs">
          <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 block">
            배송 완료
          </span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {deliveredCount}
            <span className="text-xs font-normal text-emerald-500/70 ml-1">건</span>
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 shadow-xs">
          <span className="text-xs font-semibold text-rose-800 dark:text-rose-300 block">
            취소 / 반품
          </span>
          <span className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 block">
            {claimsCount}
            <span className="text-xs font-normal text-rose-500/70 ml-1">건</span>
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

      {/* 4. 검색 및 상태 필터 탭 */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* 검색창 */}
          <div className="relative w-full sm:w-96">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="주문번호, 상품명, 수령인명, 송장번호 검색..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:outline-none transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <span className="text-xs text-slate-400 self-end sm:self-center">
            조회된 주문: <strong className="text-slate-700 dark:text-slate-200">{filteredOrders.length}</strong>건
          </span>
        </div>

        {/* 탭 버튼들 */}
        <div className="flex gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/60 overflow-x-auto text-xs font-semibold">
          {ORDER_TABS.map((tab) => {
            const count =
              tab.id === 'ALL'
                ? orders.length
                : tab.id === 'PAID'
                ? paidCount
                : tab.id === 'PREPARING'
                ? preparingCount
                : tab.id === 'SHIPPING'
                ? shippingCount
                : tab.id === 'DELIVERED'
                ? deliveredCount
                : claimsCount;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. 주문 테이블 */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 w-44">주문번호 / 일시</th>
                <th className="py-3 px-4">주문 상품 정보</th>
                <th className="py-3 px-4">수령인</th>
                <th className="py-3 px-4">결제 정보</th>
                <th className="py-3 px-4 text-center">주문 상태</th>
                <th className="py-3 px-4">배송 / 운송장 정보</th>
                <th className="py-3 px-4 text-right">배송 관리 액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-slate-300 opacity-60" />
                    해당 조건의 주문 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isExpanded = expandedOrderId === order.id;

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* 주문번호 / 일시 */}
                      <td className="py-3 px-4 align-top">
                        <span className="font-mono font-bold text-slate-900 dark:text-white block">
                          {order.orderNumber}
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {new Date(order.createdAt).toLocaleString('ko-KR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>

                      {/* 상품 정보 */}
                      <td className="py-3 px-4 align-top">
                        <div className="flex items-center gap-2.5">
                          {order.firstItemImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={order.firstItemImageUrl}
                              alt={order.orderName}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                              <Package className="w-4 h-4 text-slate-400" />
                            </div>
                          )}
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-800 dark:text-slate-100 text-sm line-clamp-1">
                              {order.orderName}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                              총 {order.itemCount}개 품목
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 수령인 */}
                      <td className="py-3 px-4 align-top">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">
                          {order.recipientName || '-'}
                        </span>
                        {order.recipientPhone && (
                          <span className="text-[11px] text-slate-400 font-mono block">
                            {order.recipientPhone}
                          </span>
                        )}
                        {order.shippingAddress && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedOrderId(isExpanded ? null : order.id)
                            }
                            className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline mt-1 cursor-pointer"
                          >
                            <MapPin className="w-3 h-3" />
                            <span>배송지 보기</span>
                          </button>
                        )}
                        {isExpanded && order.shippingAddress && (
                          <div className="mt-1.5 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
                            {order.shippingAddress}
                          </div>
                        )}
                      </td>

                      {/* 결제 정보 */}
                      <td className="py-3 px-4 align-top">
                        <span className="font-extrabold text-slate-900 dark:text-white text-sm block">
                          {order.totalPaidAmount.toLocaleString()}원
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                          {order.paymentMethodLabel}
                        </span>
                      </td>

                      {/* 주문 상태 배지 */}
                      <td className="py-3 px-4 align-top text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            order.status === 'PAID'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                              : order.status === 'PREPARING'
                              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                              : order.status === 'SHIPPING'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                              : order.status === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}
                        >
                          {order.statusLabel}
                        </span>
                      </td>

                      {/* 배송 / 운송장 정보 */}
                      <td className="py-3 px-4 align-top">
                        {order.trackingCompany && order.trackingNumber ? (
                          <div className="space-y-1">
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {order.trackingCompany}
                            </span>
                            <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                              {order.trackingNumber}
                            </span>
                            {order.status === 'SHIPPING' && (
                              <button
                                type="button"
                                onClick={() => handleOpenTrackingModal(order)}
                                className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-indigo-600 cursor-pointer"
                              >
                                <Edit2 className="w-2.5 h-2.5" />
                                <span>송장 수정</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">
                            {order.status === 'PAID'
                              ? '배송 준비 대기'
                              : order.status === 'PREPARING'
                              ? '송장 미등록'
                              : '-'}
                          </span>
                        )}
                      </td>

                      {/* 배송 관리 액션 버튼들 */}
                      <td className="py-3 px-4 align-top text-right">
                        <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-1.5">
                          {/* 1. PAID: [배송준비] 및 [송장등록] */}
                          {order.status === 'PAID' && (
                            <>
                              <button
                                type="button"
                                aria-label={`주문 ${order.orderNumber} 배송준비`}
                                onClick={() => handleMarkAsPreparing(order)}
                                disabled={isPending}
                                className="px-2.5 py-1 text-xs font-bold rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900 transition-colors cursor-pointer"
                              >
                                배송준비
                              </button>
                              <button
                                type="button"
                                aria-label={`주문 ${order.orderNumber} 송장등록`}
                                onClick={() => handleOpenTrackingModal(order)}
                                disabled={isPending}
                                className="px-2.5 py-1 text-xs font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
                              >
                                송장등록
                              </button>
                            </>
                          )}

                          {/* 2. PREPARING: [송장 등록 및 배송시작] */}
                          {order.status === 'PREPARING' && (
                            <button
                              type="button"
                              aria-label={`주문 ${order.orderNumber} 송장등록 & 배송시작`}
                              onClick={() => handleOpenTrackingModal(order)}
                              disabled={isPending}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>송장등록 & 배송시작</span>
                            </button>
                          )}

                          {/* 3. SHIPPING: [배송완료 처리] */}
                          {order.status === 'SHIPPING' && (
                            <button
                              type="button"
                              aria-label={`주문 ${order.orderNumber} 배송 완료`}
                              onClick={() => handleMarkAsDelivered(order)}
                              disabled={isPending}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>배송 완료</span>
                            </button>
                          )}

                          {/* 4. DELIVERED: 완료 배지 */}
                          {order.status === 'DELIVERED' && (
                            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                              배송 완료됨
                            </span>
                          )}

                          {/* 5. 클레임 주문: 안내문 */}
                          {(order.status === 'CANCEL_REQUESTED' ||
                            order.status === 'CANCELLED' ||
                            order.status === 'RETURN_REQUESTED' ||
                            order.status === 'RETURNED') && (
                            <span className="text-[11px] text-slate-400">
                              클레임 처리 관리
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. 송장 등록 모달 */}
      {trackingModalOrder && (
        <ShippingTrackingModal
          isOpen={Boolean(trackingModalOrder)}
          onClose={() => setTrackingModalOrder(null)}
          onConfirm={handleConfirmTracking}
          orderNumber={trackingModalOrder.orderNumber}
          orderName={trackingModalOrder.orderName}
          initialCompany={trackingModalOrder.trackingCompany}
          initialTrackingNumber={trackingModalOrder.trackingNumber}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
}
