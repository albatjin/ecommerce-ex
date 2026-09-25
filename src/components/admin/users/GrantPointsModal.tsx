'use client';

import { useState } from 'react';
import { Coins, X, AlertCircle } from 'lucide-react';
import type { AdminUserSummaryDTO } from '@/core/application/user/dto/admin-user.dto';

interface GrantPointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number, description: string) => Promise<void>;
  user: AdminUserSummaryDTO;
  isProcessing?: boolean;
}

const PRESET_AMOUNTS = [1000, 3000, 5000, 10000, 30000];
const PRESET_REASONS = [
  '관리자 특별 감사 적립금',
  '고객센터 CS 보상 적립금',
  '이벤트 프로모션 당첨',
  '우수 리뷰어 감사 리워드',
  '회원 등급 승급 축하 포인트',
];

export function GrantPointsModal({
  isOpen,
  onClose,
  onConfirm,
  user,
  isProcessing = false,
}: GrantPointsModalProps) {
  const [amount, setAmount] = useState<number>(3000);
  const [customAmountStr, setCustomAmountStr] = useState<string>('3000');
  const [description, setDescription] = useState<string>(PRESET_REASONS[0]);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPreset = (val: number) => {
    setAmount(val);
    setCustomAmountStr(val.toString());
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value.replace(/[^0-9]/g, '');
    setCustomAmountStr(valStr);
    const parsed = parseInt(valStr, 10);
    setAmount(isNaN(parsed) ? 0 : parsed);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (amount <= 0) {
      setError('지급할 적립금 금액을 1원 이상 입력해 주세요.');
      return;
    }

    if (!description.trim()) {
      setError('적립금 지급 사유를 입력해 주세요.');
      return;
    }

    try {
      await onConfirm(amount, description.trim());
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : '적립금 지급 처리 중 오류가 발생했습니다.'
      );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="grant-points-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="grant-points-modal-title"
                className="font-bold text-slate-900 dark:text-white text-base"
              >
                적립금(포인트) 수동 지급
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
          <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
              현재 보유 포인트
            </span>
            <span className="text-sm font-black text-amber-700 dark:text-amber-400">
              {user.rewardPoints.toLocaleString()}P
            </span>
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

          {/* 금액 프리셋 버튼들 */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              지급 금액 빠른 선택
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleSelectPreset(amt)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    amount === amt
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  +{amt.toLocaleString()}P
                </button>
              ))}
            </div>
          </div>

          {/* 직접 입력 인풋 */}
          <div className="space-y-1.5">
            <label
              htmlFor="points-amount-input"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              지급 포인트 (직접 입력) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="points-amount-input"
                type="text"
                value={customAmountStr}
                onChange={handleAmountChange}
                placeholder="지급할 포인트 입력"
                disabled={isProcessing}
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-bold focus:outline-none focus:border-amber-500"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                P
              </span>
            </div>
          </div>

          {/* 사유 선택 및 입력 */}
          <div className="space-y-1.5">
            <label
              htmlFor="points-reason-input"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              지급 사유 <span className="text-rose-500">*</span>
            </label>
            <select
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium focus:outline-none mb-1.5"
            >
              {PRESET_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <input
              id="points-reason-input"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="상세 사유 입력"
              disabled={isProcessing}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-amber-500"
            />
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
              className="px-5 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 rounded-xl transition-all shadow-md shadow-amber-500/20 cursor-pointer"
            >
              {isProcessing ? '지급 중...' : '적립금 즉시 지급'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
