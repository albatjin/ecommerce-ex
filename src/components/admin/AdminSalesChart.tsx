'use client';

import { useState } from 'react';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  Loader2,
  Sparkles,
  Info,
} from 'lucide-react';
import type {
  AdminSalesAnalyticsDTO,
  DailySalesItem,
} from '@/core/application/admin/dtos/AdminSalesAnalyticsDTO';
import { getAdminSalesAnalyticsAction } from '@/app/actions/admin.actions';

interface AdminSalesChartProps {
  initialData: AdminSalesAnalyticsDTO;
}

export function AdminSalesChart({ initialData }: AdminSalesChartProps) {
  const [data, setData] = useState<AdminSalesAnalyticsDTO>(initialData);
  const [period, setPeriod] = useState<'7d' | '30d'>(initialData.period);
  const [hoveredItem, setHoveredItem] = useState<DailySalesItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePeriodChange = async (newPeriod: '7d' | '30d') => {
    if (newPeriod === period || isLoading) return;
    setIsPeriodLoading(newPeriod);
  };

  const setIsPeriodLoading = async (newPeriod: '7d' | '30d') => {
    setPeriod(newPeriod);
    setIsLoading(true);
    try {
      const result = await getAdminSalesAnalyticsAction(newPeriod);
      if (result.success && result.data) {
        setData(result.data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 차트 계산
  const maxSales = Math.max(data.maxDailySales, 10000);
  const chartHeightPx = 180;

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
      {/* 1. 차트 헤더 & 기간 토글 버튼 */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              일별 매출 추이 분석
            </h2>
            {isLoading && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin ml-1" />}
          </div>
          <p className="text-xs text-slate-400">
            기간 내 실결제 주문 건의 일별 매출 합계 및 발생 추세를 모니터링합니다.
          </p>
        </div>

        {/* 기간 전환 탭 */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => handlePeriodChange('7d')}
            disabled={isLoading}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              period === '7d'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            최근 7일
          </button>
          <button
            type="button"
            onClick={() => handlePeriodChange('30d')}
            disabled={isLoading}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              period === '30d'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            최근 30일
          </button>
        </div>
      </div>

      {/* 2. 기간 요약 미니 지표 바 */}
      <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
        <div>
          <div className="text-[11px] text-slate-400 mb-0.5">기간 총 매출</div>
          <div className="text-sm sm:text-base font-black text-indigo-600 dark:text-indigo-400">
            {data.totalPeriodSales.toLocaleString()}원
          </div>
        </div>
        <div className="border-x border-slate-200 dark:border-slate-700">
          <div className="text-[11px] text-slate-400 mb-0.5">일 평균 매출</div>
          <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
            {data.averageDailySales.toLocaleString()}원
          </div>
        </div>
        <div>
          <div className="text-[11px] text-slate-400 mb-0.5">최고 매출일</div>
          <div className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400">
            {data.maxDailySales.toLocaleString()}원
          </div>
        </div>
      </div>

      {/* 3. 인터랙티브 반응형 막대 차트 (SVG / CSS) */}
      <div className="space-y-2 pt-2">
        <div
          className="relative flex items-end justify-between gap-1 sm:gap-2 h-48 px-2 pt-6 pb-2 border-b border-slate-200 dark:border-slate-800"
          style={{ height: `${chartHeightPx + 40}px` }}
        >
          {data.dailyTrend.map((item, idx) => {
            const heightPercent = Math.max(
              Math.round((item.sales / maxSales) * 100),
              item.sales > 0 ? 8 : 2
            );
            const isHovered = hoveredItem?.date === item.date;
            const isPeak = item.sales === data.maxDailySales && item.sales > 0;

            return (
              <div
                key={item.date}
                className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer"
                onMouseEnter={() => setHoveredItem(item)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {/* 최고 매출 표시 뱃지 */}
                {isPeak && period === '7d' && (
                  <div className="absolute -top-6 text-[10px] font-black text-amber-500 flex items-center gap-0.5 animate-bounce">
                    <Sparkles className="w-3 h-3" />
                    <span>최고</span>
                  </div>
                )}

                {/* 차트 막대 바 */}
                <div
                  className={`w-full max-w-[28px] rounded-t-lg transition-all duration-300 ${
                    isHovered
                      ? 'bg-indigo-600 shadow-md shadow-indigo-500/40 scale-x-105'
                      : isPeak
                      ? 'bg-gradient-to-t from-indigo-500 to-indigo-400'
                      : item.sales > 0
                      ? 'bg-indigo-200 dark:bg-indigo-900/80 hover:bg-indigo-400'
                      : 'bg-slate-100 dark:bg-slate-800'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* X축 날짜 라벨 (최근 7일은 모두 표시, 30일은 5일 간격 표시) */}
        <div className="flex justify-between px-2 text-[10px] text-slate-400 font-mono">
          {period === '7d' ? (
            data.dailyTrend.map((item) => (
              <div key={item.date} className="flex-1 text-center truncate">
                {item.label.split(' ')[0]}
              </div>
            ))
          ) : (
            data.dailyTrend
              .filter((_, idx) => idx % 5 === 0 || idx === data.dailyTrend.length - 1)
              .map((item) => (
                <div key={item.date} className="text-center">
                  {item.date.slice(5)}
                </div>
              ))
          )}
        </div>

        {/* 4. 마우스오버 상세 정보 툴팁 */}
        <div className="min-h-[38px] p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs transition-all">
          {hoveredItem ? (
            <>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white">
                  {hoveredItem.label}
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-600 dark:text-slate-300">
                  주문 <span className="font-bold text-slate-900 dark:text-white">{hoveredItem.orderCount}</span>건
                </span>
              </div>
              <div className="font-black text-indigo-600 dark:text-indigo-400 text-sm">
                {hoveredItem.sales.toLocaleString()}원
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <Info className="w-3.5 h-3.5" />
              <span>막대에 마우스를 올리면 일자별 상세 매출액과 주문 건수를 확인할 수 있습니다.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
