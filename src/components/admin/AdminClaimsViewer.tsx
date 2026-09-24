'use client';

import { useState, useMemo } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  ShoppingBag,
  ExternalLink,
  Loader2,
  X,
  ShieldCheck,
  Ban,
} from 'lucide-react';
import type { OrderListItemDTO } from '@/core/application/order/dtos/OrderDTO';
import type { OrderStatus } from '@/shared/types/database.types';
import { STATUS_STYLE_MAP } from '@/components/user/OrderListViewer';
import {
  approveReturnAction,
  rejectReturnAction,
} from '@/app/actions/order.actions';

export type ClaimFilterTab =
  | 'CLAIMS_ALL'
  | 'RETURN_REQUESTED'
  | 'CANCEL_REQUESTED'
  | 'CANCELLED'
  | 'RETURNED'
  | 'ALL';

interface AdminClaimsViewerProps {
  initialOrders: OrderListItemDTO[];
  totalCount: number;
}

const CLAIM_TABS: { id: ClaimFilterTab; label: string }[] = [
  { id: 'CLAIMS_ALL', label: '클레임 전체' },
  { id: 'RETURN_REQUESTED', label: '반품 요청(검수대기)' },
  { id: 'CANCEL_REQUESTED', label: '취소 요청' },
  { id: 'RETURNED', label: '반품 완료' },
  { id: 'CANCELLED', label: '취소 완료' },
  { id: 'ALL', label: '전체 주문 내역' },
];

export function AdminClaimsViewer({
  initialOrders,
  totalCount,
}: AdminClaimsViewerProps) {
  const [orders, setOrders] = useState<OrderListItemDTO[]>(initialOrders);
  const [activeTab, setActiveTab] = useState<ClaimFilterTab>('CLAIMS_ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // 모달 상태
  const [selectedOrder, setSelectedOrder] = useState<OrderListItemDTO | null>(null);
  const [modalType, setModalType] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // 비동기 처리 상태
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // 탭 및 검색어 필터링
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. 탭 필터
      if (activeTab === 'CLAIMS_ALL') {
        const isClaim =
          order.status === 'RETURN_REQUESTED' ||
          order.status === 'CANCEL_REQUESTED' ||
          order.status === 'RETURNED' ||
          order.status === 'CANCELLED';
        if (!isClaim) return false;
      } else if (activeTab !== 'ALL') {
        if (order.status !== activeTab) return false;
      }

      // 2. 검색어 필터
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesNumber = order.orderNumber.toLowerCase().includes(q);
        const matchesName = order.orderName.toLowerCase().includes(q);
        if (!matchesNumber && !matchesName) return false;
      }

      return true;
    });
  }, [orders, activeTab, searchQuery]);

  // 반품 승인 처리
  const handleApproveReturn = async () => {
    if (!selectedOrder) return;
    setIsProcessing(true);
    setActionError(null);

    try {
      const result = await approveReturnAction({
        orderId: selectedOrder.id,
        adminNote: adminNote.trim() || undefined,
      });

      if (!result.success) {
        setActionError(result.error || '반품 승인에 실패했습니다.');
        return;
      }

      // 상태 즉시 업데이트
      setOrders((prev) =>
        prev.map((o) =>
          o.id === selectedOrder.id
            ? { ...o, status: 'RETURNED' as OrderStatus, statusLabel: '반품 완료' }
            : o
        )
      );

      setActionSuccessMessage(
        `주문번호 ${selectedOrder.orderNumber} 건의 반품 승인 및 결제 환불(${(
          result.data?.refundedAmount ?? selectedOrder.totalPaidAmount
        ).toLocaleString()}원) 처리가 완료되었습니다.`
      );
      setModalType(null);
      setSelectedOrder(null);
      setAdminNote('');
    } catch {
      setActionError('반품 승인 처리 중 통신 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 반품 반려 처리
  const handleRejectReturn = async () => {
    if (!selectedOrder) return;
    if (!rejectionReason.trim()) {
      setActionError('반품 반려 사유를 입력해 주세요.');
      return;
    }

    setIsProcessing(true);
    setActionError(null);

    try {
      const result = await rejectReturnAction({
        orderId: selectedOrder.id,
        reason: rejectionReason.trim(),
      });

      if (!result.success) {
        setActionError(result.error || '반품 반려에 실패했습니다.');
        return;
      }

      // 상태 즉시 업데이트: DELIVERED로 복구
      setOrders((prev) =>
        prev.map((o) =>
          o.id === selectedOrder.id
            ? { ...o, status: 'DELIVERED' as OrderStatus, statusLabel: '배송 완료' }
            : o
        )
      );

      setActionSuccessMessage(
        `주문번호 ${selectedOrder.orderNumber} 건의 반품 요청이 정상적으로 반려(거절)되었습니다.`
      );
      setModalType(null);
      setSelectedOrder(null);
      setRejectionReason('');
    } catch {
      setActionError('반품 반려 처리 중 통신 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. 상단 타이틀 & 설명 */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <RotateCcw className="w-5 h-5" />
          <span className="text-xs font-black tracking-wider uppercase">
            Admin Claims Dashboard
          </span>
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            클레임 및 반품 관리
          </h1>
          <span className="text-xs font-bold text-slate-500">
            총 {totalCount.toLocaleString()}건의 주문
          </span>
        </div>
        <p className="text-xs text-slate-500 max-w-2xl">
          고객의 취소 및 반품 신청 건을 검수하고, 승인 시 자동 PG 환불·재고 복원·적립금 환불을 진행합니다.
        </p>
      </div>

      {/* 성공/안내 토스트 배너 */}
      {actionSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccessMessage(null)}
            className="p-1 text-emerald-600 hover:text-emerald-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. 검색창 & 탭 필터 바 */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        {/* 검색 입력창 */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="주문번호 또는 상품명으로 검색..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* 탭 필터 목록 */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CLAIM_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. 주문 및 클레임 목록 */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
            해당 조건의 주문/클레임 내역이 없습니다.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const style = STATUS_STYLE_MAP[order.status] || STATUS_STYLE_MAP.PAID;
            const orderDate = new Date(order.createdAt).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });
            const isReturnRequested = order.status === 'RETURN_REQUESTED';

            return (
              <div
                key={order.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3"
              >
                {/* 상단: 일시 / 주문번호 / 상태 뱃지 */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {orderDate}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <span className="font-mono text-slate-500">{order.orderNumber}</span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-bold border ${style.bg} ${style.text} ${style.border}`}
                  >
                    {order.statusLabel}
                  </span>
                </div>

                {/* 중단: 상품명 / 금액 */}
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">
                      {order.orderName}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      총 {order.itemCount}개 품목 · {order.paymentMethodLabel}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs text-slate-400">결제 금액</span>
                    <div className="text-base font-black text-slate-900 dark:text-white">
                      {order.totalPaidAmount.toLocaleString()}원
                    </div>
                  </div>
                </div>

                {/* 하단: 클레임 처리 액션 바 (반품 요청 상태일 때 관리자 승인/반려 버튼 노출) */}
                {isReturnRequested && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOrder(order);
                        setModalType('REJECT');
                        setActionError(null);
                      }}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900 transition-colors"
                    >
                      반품 반려
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOrder(order);
                        setModalType('APPROVE');
                        setActionError(null);
                      }}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>반품 승인 및 환불</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. 반품 승인 모달 */}
      {/* ========================================================= */}
      {modalType === 'APPROVE' && selectedOrder && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  반품 승인 및 환불 처리
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalType(null)}
                disabled={isProcessing}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs space-y-2">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>주문 번호</span>
                <span className="font-mono font-bold">{selectedOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>환불 집행 금액</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {selectedOrder.totalPaidAmount.toLocaleString()}원
                </span>
              </div>
              <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                승인 시 PG사 결제 승인 취소, 재고 입고 복원 및 적립금 환불이 일괄 실행됩니다.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                관리자 처리 메모 (선택)
              </label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="검수 내역이나 특이사항을 입력하세요."
                rows={2}
                className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              />
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-xs font-bold text-rose-700 dark:text-rose-300">
                {actionError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setModalType(null)}
                disabled={isProcessing}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={handleApproveReturn}
                disabled={isProcessing}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-600/20 disabled:opacity-50"
              >
                {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>환불 집행 및 승인</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. 반품 반려(거절) 모달 */}
      {/* ========================================================= */}
      {modalType === 'REJECT' && selectedOrder && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Ban className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  반품 요청 반려
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalType(null)}
                disabled={isProcessing}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 text-xs text-rose-800 dark:text-rose-300">
              반려 시 주문 상태가 배송 완료(DELIVERED) 상태로 복구되며, 고객에게 사유가 통보됩니다.
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                반려 사유 (필수)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="예: 고객 부주의로 인한 상품 훼손, 태그 분실 등"
                rows={3}
                className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-white"
              />
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-xs font-bold text-rose-700 dark:text-rose-300">
                {actionError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setModalType(null)}
                disabled={isProcessing}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleRejectReturn}
                disabled={isProcessing}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors flex items-center gap-1.5 shadow-md shadow-rose-600/20 disabled:opacity-50"
              >
                {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>반려 확정</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

