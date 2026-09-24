'use client';

import { Truck, Sparkles } from 'lucide-react';

interface FreeShippingGaugeProps {
  currentAmount: number;
  threshold?: number;
}

export function FreeShippingGauge({
  currentAmount,
  threshold = 50000,
}: FreeShippingGaugeProps) {
  const diff = threshold - currentAmount;
  const isFree = diff <= 0;
  const progressPercent = Math.min(100, Math.max(0, Math.round((currentAmount / threshold) * 100)));

  return (
    <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60">
      <div className="flex items-center justify-between text-xs mb-2">
        <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
          <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>무료배송 혜택</span>
        </div>
        {isFree ? (
          <span className="flex items-center gap-1 font-extrabold text-blue-600 dark:text-blue-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            무료배송 달성!
          </span>
        ) : (
          <span className="text-slate-600 dark:text-slate-400">
            <strong className="text-blue-600 dark:text-blue-400 font-bold">
              {diff.toLocaleString()}원
            </strong>{' '}
            더 담으면 무료배송
          </span>
        )}
      </div>

      {/* 게이지 바 */}
      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isFree ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-blue-600'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}

