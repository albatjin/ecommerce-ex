'use client';

import Link from 'next/link';
import {
  Layers,
  ChevronRight,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from 'lucide-react';
import type { OrderStatusPipelineItem } from '@/core/application/admin/dtos/AdminSalesAnalyticsDTO';

interface OrderStatusPipelineProps {
  pipeline: OrderStatusPipelineItem[];
  totalOrders: number;
}

export function OrderStatusPipeline({
  pipeline,
  totalOrders,
}: OrderStatusPipelineProps) {
  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
      {/* 1. 헤더 */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              주문 상태별 파이프라인
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            결제부터 배송 완료 및 클레임까지 주문의 라이프사이클 분포 현황입니다.
          </p>
        </div>

        <div className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          총 관리 주문: <span className="text-indigo-600 dark:text-indigo-400">{totalOrders}건</span>
        </div>
      </div>

      {/* 2. 누적 멀티 스택 게이지 바 */}
      {totalOrders > 0 && (
        <div className="space-y-1.5">
          <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex shadow-inner">
            {pipeline
              .filter((item) => item.count > 0)
              .map((item) => (
                <div
                  key={item.status}
                  className={`${item.color} h-full transition-all duration-500`}
                  style={{ width: `${item.percentage}%` }}
                  title={`${item.label}: ${item.count}건 (${item.percentage}%)`}
                />
              ))}
          </div>
        </div>
      )}

      {/* 3. 상태별 카드 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {pipeline.map((item) => {
          const isClaim =
            item.status === 'CANCEL_REQUESTED' ||
            item.status === 'RETURN_REQUESTED' ||
            item.status === 'CANCELLED' ||
            item.status === 'RETURNED';

          const targetUrl = isClaim ? '/admin/claims' : '/admin/orders';

          return (
            <Link
              key={item.status}
              href={targetUrl}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 hover:border-indigo-500/50 hover:bg-white dark:hover:bg-slate-800 transition-all space-y-1 group block"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {item.label}
                  </span>
                </div>
                <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <span className="text-lg font-black text-slate-900 dark:text-white">
                  {item.count}
                  <span className="text-xs font-normal ml-0.5 text-slate-400">건</span>
                </span>
                <span className="text-[11px] font-mono font-semibold text-slate-400">
                  {item.percentage}%
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
