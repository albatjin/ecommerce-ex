'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Truck,
  CreditCard,
  ShoppingBag,
  CheckCircle2,
  Box,
  AlertTriangle,
  RotateCcw,
  XCircle,
  X,
  Loader2,
  Info,
} from 'lucide-react';
import type { OrderDetailDTO } from '@/core/application/order/dtos/OrderDTO';
import type { OrderStatus } from '@/shared/types/database.types';
import { STATUS_STYLE_MAP } from './OrderListViewer';
import {
  cancelOrderAction,
  requestReturnAction,
} from '@/app/actions/order.actions';

interface OrderDetailViewerProps {
  order: OrderDetailDTO;
}

const ORDER_STEPS = [
  { key: 'PAID', label: '결제 완료', icon: CheckCircle2 },
  { key: 'PREPARING', label: '상품 준비 중', icon: Box },
  { key: 'SHIPPING', label: '배송 중', icon: Truck },
  { key: 'DELIVERED', label: '배송 완료', icon: CheckCircle2 },
];

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

export function OrderDetailViewer({ order }: OrderDetailViewerProps) {
  const router = useRouter();

  // 내부 상태 관리 (즉각적인 UI 반응을 위해)
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(order.status);
  const [currentStatusLabel, setCurrentStatusLabel] = useState(order.statusLabel);

  // 모달 상태
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

  // 사유 입력
  const [selectedCancelPreset, setSelectedCancelPreset] = useState(CANCEL_REASONS[0]);
  const [cancelDetail, setCancelDetail] = useState('');
  const [selectedReturnPreset, setSelectedReturnPreset] = useState(RETURN_REASONS[0]);
  const [returnDetail, setReturnDetail] = useState('');

  // 비동기 처리 상태
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const currentStepIndex = ORDER_STEPS.findIndex((s) => s.key === currentStatus);
  const isCancelledOrReturned =
    currentStatus === 'CANCELLED' ||
    currentStatus === 'CANCEL_REQUESTED' ||
    currentStatus === 'RETURNED' ||
    currentStatus === 'RETURN_REQUESTED';

  const isCancellable =
    currentStatus === 'PAID' || currentStatus === 'PAYMENT_PENDING';
  const isReturnEligible = currentStatus === 'DELIVERED';

  const orderDate = new Date(order.createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const style = STATUS_STYLE_MAP[currentStatus] || STATUS_STYLE_MAP.PAID;

  // 주문 취소 처리
  const handleCancelOrder = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const fullReason =
      selectedCancelPreset === '기타 사유' && cancelDetail.trim()
        ? cancelDetail.trim()
        : cancelDetail.trim()
        ? `${selectedCancelPreset}: ${cancelDetail.trim()}`
        : selectedCancelPreset;

    try {
      const result = await cancelOrderAction({
        orderId: order.id,
        reason: fullReason,
      });

      if (!result.success) {
        setErrorMessage(result.error || '주문 취소에 실패했습니다.');
        return;
      }

      setCurrentStatus('CANCELLED');
      setCurrentStatusLabel('주문 취소');
      setIsCancelModalOpen(false);
      setSuccessBanner(
        `주문 취소가 완료되었습니다. (환불 완료 금액: ${(
          result.data?.refundedAmount ?? order.totalPaidAmount
        ).toLocaleString()}원)`
      );
      router.refresh();
    } catch {
      setErrorMessage('주문 취소 중 통신 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 반품 신청 처리
  const handleRequestReturn = async () => {
    const fullReason =
      selectedReturnPreset === '기타 사유' && returnDetail.trim()
        ? returnDetail.trim()
        : returnDetail.trim()
        ? `${selectedReturnPreset}: ${returnDetail.trim()}`
        : selectedReturnPreset;

    if (!fullReason.trim()) {
      setErrorMessage('반품 사유를 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await requestReturnAction({
        orderId: order.id,
        reason: fullReason,
      });

      if (!result.success) {
        setErrorMessage(result.error || '반품 신청에 실패했습니다.');
        return;
      }

      setCurrentStatus('RETURN_REQUESTED');
      setCurrentStatusLabel('반품 신청');
      setIsReturnModalOpen(false);
      setSuccessBanner(
        '반품 신청이 성공적으로 접수되었습니다. 고객센터에서 회수 기사님을 배정해 드릴 예정입니다.'
      );
      router.refresh();
    } catch {
      setErrorMessage('반품 신청 중 통신 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-extrabold border ${style.bg} ${style.text} ${style.border}`}
            >
              {currentStatusLabel}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-xs text-slate-400">주문일시: {orderDate}</span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
              {order.orderNumber}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-xs text-slate-400">총 결제금액</span>
              <div className="text-xl font-black text-blue-600 dark:text-blue-400">
                {order.totalPaidAmount.toLocaleString()}원
              </div>
            </div>

            {/* 주문 취소 / 반품 신청 액션 버튼 */}
            {isCancellable && (
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setIsCancelModalOpen(true);
                }}
                className="px-4 py-2 rounded-2xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-950/60 border border-rose-200 dark:border-rose-900 transition-colors shadow-xs"
              >
                주문 취소
              </button>
            )}

            {isReturnEligible && (
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setIsReturnModalOpen(true);
                }}
                className="px-4 py-2 rounded-2xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 dark:hover:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900 transition-colors shadow-xs"
              >
                반품 신청
              </button>
            )}
          </div>
        </div>

        {/* 성공 안내 배너 */}
        {successBanner && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{successBanner}</span>
          </div>
        )}

        {/* 클레임 상태 안내 배너 */}
        {currentStatus === 'CANCELLED' && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2.5">
            <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">주문이 정상적으로 취소되었습니다.</p>
              <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                결제 승인 취소 및 환불이 완료되었으며, 사용하신 적립금과 쿠폰이 원상 복구되었습니다.
              </p>
            </div>
          </div>
        )}

        {currentStatus === 'RETURN_REQUESTED' && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
            <RotateCcw className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">반품 신청이 접수되었습니다.</p>
              <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                담당 기사님이 수거를 위해 방문할 예정입니다. 상품이 회수되어 검수가 완료되면 환불이 최종 승인됩니다.
              </p>
            </div>
          </div>
        )}

        {/* 2. 배송 상태 진행 바 (취소/반품이 아닐 경우) */}
        {!isCancelledOrReturned && (
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

      {/* 2.5 주문 취소 / 반품 신청 전용 인터랙티브 패널 */}
      {(isCancellable || isReturnEligible || isCancelledOrReturned) && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <RotateCcw className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              주문 변경 및 클레임 안내
            </h2>
          </div>

          {isCancellable && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50">
              <div className="space-y-1">
                <span className="text-xs font-bold text-rose-700 dark:text-rose-400">
                  주문 취소 가능
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  아직 배송 출발 전 단계로, 즉시 주문 취소 및 결제 금액 환불이 가능합니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setIsCancelModalOpen(true);
                }}
                className="py-2.5 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shrink-0 shadow-xs"
              >
                주문 취소 신청
              </button>
            </div>
          )}

          {isReturnEligible && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50">
              <div className="space-y-1">
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">
                  반품 신청 가능
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  배송이 완료된 주문입니다. 상품에 문제가 있거나 단순 변심 시 반품을 접수하실 수 있습니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setIsReturnModalOpen(true);
                }}
                className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shrink-0 shadow-xs"
              >
                반품 신청 접수
              </button>
            </div>
          )}

          {currentStatus === 'CANCELLED' && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <span className="font-bold text-slate-900 dark:text-white">취소 완료 안내</span>
              <p>이 주문은 취소 처리가 완료되어 더 이상 변경하실 수 없습니다.</p>
            </div>
          )}

          {currentStatus === 'RETURN_REQUESTED' && (
            <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 text-xs text-amber-800 dark:text-amber-300 space-y-1">
              <span className="font-bold">반품 회수 진행 중</span>
              <p>반품 요청이 접수되어 전담 택배사에서 상품 수거 일정을 조율 중입니다.</p>
            </div>
          )}
        </div>
      )}

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

      {/* ========================================================= */}
      {/* 5. 주문 취소 모달 */}
      {/* ========================================================= */}
      {isCancelModalOpen && (
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
                onClick={() => setIsCancelModalOpen(false)}
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
                <span className="font-mono font-bold">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>환불 예정 금액</span>
                <span className="font-bold text-rose-600">
                  {order.totalPaidAmount.toLocaleString()}원
                </span>
              </div>
              {order.pointUsed > 0 && (
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>반환 예정 적립금</span>
                  <span className="font-bold text-amber-600">
                    +{order.pointUsed.toLocaleString()}P
                  </span>
                </div>
              )}
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
                    onClick={() => setSelectedCancelPreset(preset)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      selectedCancelPreset === preset
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
                주문 취소 시 즉시 승인 취소 및 환불 절차가 진행되며, 주문 상품의 재고가 복원됩니다.
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
                onClick={() => setIsCancelModalOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
      {/* 6. 반품 신청 모달 */}
      {/* ========================================================= */}
      {isReturnModalOpen && (
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
                onClick={() => setIsReturnModalOpen(false)}
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
                <span className="font-mono font-bold">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>결제 금액</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {order.totalPaidAmount.toLocaleString()}원
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
                    onClick={() => setSelectedReturnPreset(preset)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      selectedReturnPreset === preset
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
                onClick={() => setIsReturnModalOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
