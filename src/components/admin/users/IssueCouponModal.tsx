'use client';

import { useState } from 'react';
import { Ticket, X, AlertCircle } from 'lucide-react';
import type { AdminUserSummaryDTO } from '@/core/application/user/dto/admin-user.dto';

interface IssueCouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    name: string;
    discountAmount?: number | null;
    discountRate?: number | null;
    minOrderAmount: number;
    validDays: number;
  }) => Promise<void>;
  user: AdminUserSummaryDTO;
  isProcessing?: boolean;
}

const PRESET_COUPONS = [
  { name: '관리자 발급 감사 10% 할인 쿠폰', rate: 10, amount: null, minOrder: 20000, days: 30 },
  { name: '관리자 발급 특별 5,000원 할인 쿠폰', rate: null, amount: 5000, minOrder: 30000, days: 14 },
  { name: 'VIP 전용 15% 깜짝 할인 쿠폰', rate: 15, amount: null, minOrder: 50000, days: 30 },
  { name: 'CS 보상 10,000원 할인 쿠폰', rate: null, amount: 10000, minOrder: 20000, days: 60 },
];

export function IssueCouponModal({
  isOpen,
  onClose,
  onConfirm,
  user,
  isProcessing = false,
}: IssueCouponModalProps) {
  const [couponName, setCouponName] = useState(PRESET_COUPONS[0].name);
  const [discountType, setDiscountType] = useState<'RATE' | 'AMOUNT'>('RATE');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minOrderAmount, setMinOrderAmount] = useState<number>(20000);
  const [validDays, setValidDays] = useState<number>(30);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: (typeof PRESET_COUPONS)[0]) => {
    setCouponName(preset.name);
    if (preset.rate) {
      setDiscountType('RATE');
      setDiscountValue(preset.rate);
    } else if (preset.amount) {
      setDiscountType('AMOUNT');
      setDiscountValue(preset.amount);
    }
    setMinOrderAmount(preset.minOrder);
    setValidDays(preset.days);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!couponName.trim()) {
      setError('쿠폰명을 입력해 주세요.');
      return;
    }

    if (discountType === 'RATE' && (discountValue <= 0 || discountValue > 100)) {
      setError('할인율은 1% 이상 100% 이하여야 합니다.');
      return;
    }

    if (discountType === 'AMOUNT' && discountValue <= 0) {
      setError('할인 금액은 1원 이상이어야 합니다.');
      return;
    }

    try {
      await onConfirm({
        name: couponName.trim(),
        discountRate: discountType === 'RATE' ? discountValue : null,
        discountAmount: discountType === 'AMOUNT' ? discountValue : null,
        minOrderAmount,
        validDays,
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : '쿠폰 발급 처리 중 오류가 발생했습니다.'
      );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="issue-coupon-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="issue-coupon-modal-title"
                className="font-bold text-slate-900 dark:text-white text-base"
              >
                전용 쿠폰 수동 발급
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {user.customerNumber} · {user.name}
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
          {error && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300 font-medium"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* 프리셋 선택 */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              추천 쿠폰 템플릿
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {PRESET_COUPONS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="p-2 text-left rounded-xl border border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-800 bg-slate-50/50 dark:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200 line-clamp-1 block">
                    {p.name}
                  </span>
                  <span className="text-[11px] text-rose-600 dark:text-rose-400 font-extrabold block mt-0.5">
                    {p.rate ? `${p.rate}% 할인` : `${p.amount?.toLocaleString()}원 할인`}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 쿠폰명 입력 */}
          <div className="space-y-1.5">
            <label
              htmlFor="coupon-name-input"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              쿠폰명 <span className="text-rose-500">*</span>
            </label>
            <input
              id="coupon-name-input"
              type="text"
              value={couponName}
              onChange={(e) => setCouponName(e.target.value)}
              placeholder="예: VIP 회원 감사 10% 쿠폰"
              disabled={isProcessing}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:border-rose-500 font-medium"
            />
          </div>

          {/* 할인 방식 & 값 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label
                htmlFor="discount-type-select"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                할인 방식
              </label>
              <select
                id="discount-type-select"
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as 'RATE' | 'AMOUNT')}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold focus:outline-none"
              >
                <option value="RATE">정률 할인 (%)</option>
                <option value="AMOUNT">정액 할인 (원)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="discount-val-input"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                할인 값 ({discountType === 'RATE' ? '%' : '원'})
              </label>
              <input
                id="discount-val-input"
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold focus:outline-none"
              />
            </div>
          </div>

          {/* 최소주문금액 & 유효기간 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label
                htmlFor="min-order-input"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                최소 주문 금액 (원)
              </label>
              <input
                id="min-order-input"
                type="number"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="valid-days-input"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                유효기간 (일)
              </label>
              <input
                id="valid-days-input"
                type="number"
                value={validDays}
                onChange={(e) => setValidDays(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none"
              />
            </div>
          </div>

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
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl transition-all shadow-md shadow-rose-600/20 cursor-pointer"
            >
              {isProcessing ? '발급 중...' : '쿠폰 즉시 발급'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
