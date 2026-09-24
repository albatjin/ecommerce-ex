'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PackageCheck,
  ChevronRight,
  ShoppingBag,
  ExternalLink,
  AlertTriangle,
  RotateCcw,
  XCircle,
  X,
  Loader2,
  CheckCircle2,
  Info,
} from 'lucide-react';
import type { OrderListItemDTO } from '@/core/application/order/dtos/OrderDTO';
import type { OrderStatus } from '@/shared/types/database.types';
import {
  cancelOrderAction,
  requestReturnAction,
} from '@/app/actions/order.actions';

interface OrderListViewerProps {
  initialOrders: OrderListItemDTO[];
  totalCount: number;
  initialTab?: FilterTab;
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

const CANCEL_REASONS = [
  '단순 변심',
  '배송지/옵션 변경 후 재주문',
  '배송 지연 예상',
  '다른 상품으로 재주문',
  '기타 사유',
];

const RETURN_REASONS = [
  '상품 파손 / 불량',
  '오배송 / 상품 누락',
  '단순 변심 (사이즈/색상 불일치)',
  '상품 설명과 다름',
  '기타 사유',
];

export function OrderListViewer({
  initialOrders,
  totalCount,
  initialTab = 'ALL',
}: OrderListViewerProps) {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderListItemDTO[]>(initialOrders);
  const [activeTab, setActiveTab] = useState<FilterTab>(initialTab);

  // 모달 상태
  const [selectedOrder, setSelectedOrder] = useState<OrderListItemDTO | null>(null);
  const [modalType, setModalType] = useState<'CANCEL' | 'RETURN' | null>(null);

  // 사유 입력
  const [cancelPreset, setCancelPreset] = useState(CANCEL_REASONS[0]);
  const [cancelDetail, setCancelDetail] = useState('');
  const [returnPreset, setReturnPreset] = useState(RETURN_REASONS[0]);
  const [returnDetail, setReturnDetail] = useState('');

  // 비동기 처리
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const filteredOrders = useMemo(() => {
    if (activeTab === 'ALL') return orders;
    if (activeTab === 'CANCELLED') {
      return orders.filter(
        (o) =>
          o.status === 'CANCELLED' ||
          o.status === 'CANCEL_REQUESTED' ||
          o.status === 'RETURNED' ||
          o.status === 'RETURN_REQUESTED'
      );
    }
    return orders.filter((o) => o.status === activeTab);
  }, [orders, activeTab]);

  // 주문 취소 처리
  const handleCancelOrder = async () => {
    if (!selectedOrder) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    const fullReason =
      cancelPreset === '기타 사유' && cancelDetail.trim()
        ? cancelDetail.trim()
        : cancelDetail.trim()
        ? `${cancelPreset}: ${cancelDetail.trim()}`
        : cancelPreset;

    try {
      const result = await cancelOrderAction({
        orderId: selectedOrder.id,
        reason: fullReason,
      });

      if (!result.success) {
        setErrorMessage(result.error || '주문 취소에 실패했습니다.');
        return;
      }

      setOrders((prev) =>
        prev.map((o) =>
          o.id === selectedOrder.id
            ? { ...o, status: 'CANCELLED' as OrderStatus, statusLabel: '주문 취소' }
            : o
        )
      );

      setSuccessBanner(
        `주문번호 ${selectedOrder.orderNumber} 건이 성공적으로 취소되었습니다. (환불 완료: ${(
          result.data?.refundedAmount ?? selectedOrder.totalPaidAmount
        ).toLocaleString()}원)`
      );
      setModalType(null);
      setSelectedOrder(null);
      router.refresh();
    } catch {
      setErrorMessage('주문 취소 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 반품 신청 처리
  const handleRequestReturn = async () => {
    if (!selectedOrder) return;
    const fullReason =
      returnPreset === '기타 사유' && returnDetail.trim()
        ? returnDetail.trim()
        : returnDetail.trim()
        ? `${returnPreset}: ${returnDetail.trim()}`
        : returnPreset;

    if (!fullReason.trim()) {
      setErrorMessage('반품 사유를 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await requestReturnAction({
        orderId: selectedOrder.id,
        reason: fullReason,
      });

      if (!result.success) {
        setErrorMessage(result.error || '반품 신청에 실패했습니다.');
        return;
      }

      setOrders((prev) =>
        prev.map((o) =>
          o.id === selectedOrder.id
            ? { ...o, status: 'RETURN_REQUESTED' as OrderStatus, statusLabel: '반품 신청' }
            : o
        )
      );

      setSuccessBanner(
        `주문번호 ${selectedOrder.orderNumber} 건의 반품 신청이 접수되었습니다. 택배 회수가 진행될 예정입니다.`
      );
      setModalType(null);
      setSelectedOrder(null);
      router.refresh();
    } catch {
      setErrorMessage('반품 신청 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. 상단 타이틀 & 탭 필터 */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              주문 / 배송 조회
            </h1>
          </div>
          <span className="text-xs font-bold text-slate-400">
            총 {totalCount}건의 주문 내역
          </span>
        </div>

        {/* 성공 배너 */}
        {successBanner && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{successBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessBanner(null)}
              className="p-1 text-emerald-600 hover:text-emerald-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 탭 필터 바 */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-4 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60'
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

            const isCancellable =
              order.status === 'PAID' || order.status === 'PAYMENT_PENDING';
            const isReturnEligible = order.status === 'DELIVERED';

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

                  {/* PC용 액션 버튼 모음 */}
                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    {isCancellable && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOrder(order);
                          setModalType('CANCEL');
                          setErrorMessage(null);
                        }}
                        className="py-2.5 px-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold text-xs border border-rose-200 dark:border-rose-900 transition-colors shadow-2xs"
                      >
                        주문 취소
                      </button>
                    )}

                    {isReturnEligible && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOrder(order);
                          setModalType('RETURN');
                          setErrorMessage(null);
                        }}
                        className="py-2.5 px-3.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs border border-indigo-200 dark:border-indigo-900 transition-colors shadow-2xs"
                      >
                        반품 신청
                      </button>
                    )}

                    <Link
                      href={`/my-page/orders/${order.id}`}
                      className="inline-flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200/80 dark:border-slate-700 transition-all"
                    >
                      <span>주문 상세</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </Link>
                  </div>
                </div>

                {/* 모바일용 액션 버튼 바 */}
                <div className="sm:hidden pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {isCancellable && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOrder(order);
                          setModalType('CANCEL');
                          setErrorMessage(null);
                        }}
                        className="py-1.5 px-3 rounded-lg bg-rose-50 text-rose-600 text-xs font-bold border border-rose-200"
                      >
                        주문 취소
                      </button>
                    )}
                    {isReturnEligible && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOrder(order);
                          setModalType('RETURN');
                          setErrorMessage(null);
                        }}
                        className="py-1.5 px-3 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-bold border border-indigo-200"
                      >
                        반품 신청
                      </button>
                    )}
                  </div>
                  <Link
                    href={`/my-page/orders/${order.id}`}
                    className="flex items-center gap-1 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <span>상세보기</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. 주문 취소 폼 모달 */}
      {/* ========================================================= */}
      {modalType === 'CANCEL' && selectedOrder && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  주문 취소 신청
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalType(null)}
                disabled={isSubmitting}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 취소 요약 정보 */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>주문 번호</span>
                <span className="font-mono font-bold">{selectedOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>환불 예정 금액</span>
                <span className="font-bold text-rose-600">
                  {selectedOrder.totalPaidAmount.toLocaleString()}원
                </span>
              </div>
            </div>

            {/* 취소 사유 선택 */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                취소 사유 선택
              </label>
              <div className="flex flex-wrap gap-2">
                {CANCEL_REASONS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCancelPreset(preset)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      cancelPreset === preset
                        ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <textarea
                value={cancelDetail}
                onChange={(e) => setCancelDetail(e.target.value)}
                placeholder="상세 사유가 있으시면 입력해 주세요 (선택사항)"
                rows={2}
                className="w-full mt-2 p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-white"
              />
            </div>

            {/* 안내 문구 */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 text-[11px] text-rose-700 dark:text-rose-300">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                주문 취소 시 즉시 결제 승인 취소 및 환불 절차가 진행되며, 사용하신 적립금과 쿠폰이 복원됩니다.
              </span>
            </div>

            {/* 오류 메시지 */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-xs font-bold text-rose-700 dark:text-rose-300">
                {errorMessage}
              </div>
            )}

            {/* 버튼 액션 */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setModalType(null)}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                돌아가기
              </button>
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors flex items-center gap-1.5 shadow-md shadow-rose-600/20 disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>주문 취소 확정</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. 반품 신청 폼 모달 */}
      {/* ========================================================= */}
      {modalType === 'RETURN' && selectedOrder && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  반품 신청
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalType(null)}
                disabled={isSubmitting}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 반품 주문 정보 */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>주문 번호</span>
                <span className="font-mono font-bold">{selectedOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>결제 금액</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedOrder.totalPaidAmount.toLocaleString()}원
                </span>
              </div>
            </div>

            {/* 반품 사유 선택 */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                반품 사유 선택 (필수)
              </label>
              <div className="flex flex-wrap gap-2">
                {RETURN_REASONS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setReturnPreset(preset)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      returnPreset === preset
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <textarea
                value={returnDetail}
                onChange={(e) => setReturnDetail(e.target.value)}
                placeholder="상세 사유를 자세히 적어주시면 빠른 처리에 도움이 됩니다."
                rows={3}
                className="w-full mt-2 p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              />
            </div>

            {/* 안내 문구 */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 text-[11px] text-indigo-700 dark:text-indigo-300">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                반품 신청 접수 후 1~2영업일 이내에 수거 기사님이 방문하므로, 원래 상품 포장 상태로 보관해 주시기 바랍니다.
              </span>
            </div>

            {/* 오류 메시지 */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-xs font-bold text-rose-700 dark:text-rose-300">
                {errorMessage}
              </div>
            )}

            {/* 버튼 액션 */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setModalType(null)}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                돌아가기
              </button>
              <button
                type="button"
                onClick={handleRequestReturn}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-600/20 disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>반품 신청 접수</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
