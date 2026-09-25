'use client';

import { useState } from 'react';
import { Truck, X, AlertCircle } from 'lucide-react';

export const POPULAR_COURIERS = [
  'CJ대한통운',
  '우체국택배',
  '한진택배',
  '롯데택배',
  '로젠택배',
  '경동택배',
  'CU 편의점택배',
  'GS25 편의점택배',
  '직접배송/화물',
];

interface ShippingTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (trackingCompany: string, trackingNumber: string) => Promise<void>;
  orderNumber: string;
  orderName: string;
  initialCompany?: string | null;
  initialTrackingNumber?: string | null;
  isProcessing?: boolean;
}

export function ShippingTrackingModal({
  isOpen,
  onClose,
  onConfirm,
  orderNumber,
  orderName,
  initialCompany = 'CJ대한통운',
  initialTrackingNumber = '',
  isProcessing = false,
}: ShippingTrackingModalProps) {
  const [trackingCompany, setTrackingCompany] = useState(
    initialCompany || 'CJ대한통운'
  );
  const [trackingNumber, setTrackingNumber] = useState(
    initialTrackingNumber || ''
  );
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const comp = trackingCompany.trim();
    const num = trackingNumber.trim();

    if (!comp) {
      setError('택배사를 선택해 주세요.');
      return;
    }
    if (!num) {
      setError('송장(운송장) 번호를 입력해 주세요.');
      return;
    }
    if (num.length < 5) {
      setError('올바른 송장 번호(최소 5자리 이상)를 입력해 주세요.');
      return;
    }

    try {
      await onConfirm(comp, num);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '송장 등록 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tracking-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="tracking-modal-title"
                className="font-bold text-slate-900 dark:text-white text-base"
              >
                배송 시작 & 운송장 번호 등록
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {orderNumber}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 폼 본문 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
            <span className="font-semibold block text-slate-900 dark:text-white mb-0.5">
              대상 주문
            </span>
            <span className="line-clamp-1">{orderName}</span>
          </div>

          {error && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300 font-medium"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* 택배사 선택 */}
          <div className="space-y-1.5">
            <label
              htmlFor="courier-select"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              택배사 선택 <span className="text-rose-500">*</span>
            </label>
            <select
              id="courier-select"
              value={trackingCompany}
              onChange={(e) => setTrackingCompany(e.target.value)}
              disabled={isProcessing}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-semibold focus:outline-none focus:border-indigo-500"
            >
              {POPULAR_COURIERS.map((courier) => (
                <option key={courier} value={courier}>
                  {courier}
                </option>
              ))}
            </select>
          </div>

          {/* 송장 번호 입력 */}
          <div className="space-y-1.5">
            <label
              htmlFor="tracking-input"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              송장(운송장) 번호 <span className="text-rose-500">*</span>
            </label>
            <input
              id="tracking-input"
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="하이픈(-) 없이 숫자만 입력 (예: 68392019482)"
              disabled={isProcessing}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          {/* 안내문 */}
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            운송장 번호를 등록하면 주문 상태가 즉시 <strong>&apos;배송 중(SHIPPING)&apos;</strong>으로 변경되며, 고객 마이페이지에 실시간 반영됩니다.
          </p>

          {/* 버튼 영역 */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              {isProcessing ? '처리 중...' : '배송 시작 및 송장 등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
