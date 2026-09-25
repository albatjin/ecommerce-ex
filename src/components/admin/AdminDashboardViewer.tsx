'use client';

import Link from 'next/link';
import {
  Coins,
  ShoppingBag,
  RotateCcw,
  MessageSquare,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle2,
  ExternalLink,
  Package,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import type { AdminDashboardDTO } from '@/core/application/admin/dtos/AdminDashboardDTO';
import { STATUS_STYLE_MAP } from '@/components/user/OrderListViewer';

interface AdminDashboardViewerProps {
  initialData: AdminDashboardDTO;
}

export function AdminDashboardViewer({ initialData }: AdminDashboardViewerProps) {
  const {
    totalRevenue,
    todayRevenue,
    totalOrdersCount,
    todayOrdersCount,
    pendingClaimsCount,
    pendingReturnsCount,
    pendingCancelsCount,
    pendingInquiriesCount,
    totalInquiriesCount,
    recentOrders,
    recentPendingInquiries,
    generatedAt,
  } = initialData;

  const formattedGeneratedAt = new Date(generatedAt).toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* 1. 상단 환영 & 운영 현황 헤더 카드 */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shrink-0">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                통합 운영 대시보드
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                실시간
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              기준 시각: {formattedGeneratedAt} | 전자상거래 핵심 지표 및 클레임/문의 현황
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/claims"
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <span>클레임 관리</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/admin/inquiries"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-indigo-600/30"
          >
            <span>1:1 문의 답변</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 2. 긴급 처리 필요 알림 배너 (클레임 또는 미답변 문의 존재 시) */}
      {(pendingClaimsCount > 0 || pendingInquiriesCount > 0) && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div className="text-xs sm:text-sm text-amber-900 dark:text-amber-200 font-semibold">
              신속한 처리가 필요한 관리 항목이 있습니다:
              {pendingClaimsCount > 0 && (
                <span className="ml-1 font-black text-rose-600 dark:text-rose-400">
                  반품/취소 검수 {pendingClaimsCount}건
                </span>
              )}
              {pendingClaimsCount > 0 && pendingInquiriesCount > 0 && (
                <span className="mx-1">/</span>
              )}
              {pendingInquiriesCount > 0 && (
                <span className="font-black text-indigo-600 dark:text-indigo-400">
                  미답변 1:1 문의 {pendingInquiriesCount}건
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pendingClaimsCount > 0 && (
              <Link
                href="/admin/claims"
                className="px-3 py-1.5 rounded-lg bg-amber-200/80 dark:bg-amber-900/60 hover:bg-amber-300 dark:hover:bg-amber-800 text-amber-900 dark:text-amber-100 text-xs font-bold transition-colors"
              >
                클레임 검수하기
              </Link>
            )}
            {pendingInquiriesCount > 0 && (
              <Link
                href="/admin/inquiries"
                className="px-3 py-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 hover:bg-indigo-200 dark:hover:bg-indigo-800 text-indigo-900 dark:text-indigo-100 text-xs font-bold transition-colors"
              >
                문의 답변하기
              </Link>
            )}
          </div>
        </div>
      )}

      {/* 3. 4대 핵심 KPI 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: 누적 총 매출액 */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 hover:border-blue-500/50 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Coins className="w-6 h-6" />
            </div>
            <span className="flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-900">
              <TrendingUp className="w-3 h-3" />
              <span>실결제 기준</span>
            </span>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              총 누적 매출액
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {totalRevenue.toLocaleString()}
              <span className="text-base font-bold ml-1 text-slate-500">원</span>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">오늘 발생 매출</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">
              +{todayRevenue.toLocaleString()}원
            </span>
          </div>
        </div>

        {/* KPI 2: 주문 접수 현황 */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
              <span>전체 주문</span>
            </span>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              주문 접수 건수
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {totalOrdersCount.toLocaleString()}
              <span className="text-base font-bold ml-1 text-slate-500">건</span>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">오늘 신규 주문</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              +{todayOrdersCount}건
            </span>
          </div>
        </div>

        {/* KPI 3: 클레임 및 반품 대기 */}
        <Link
          href="/admin/claims"
          className="group p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 hover:border-rose-500/60 hover:shadow-md transition-all block"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <RotateCcw className="w-6 h-6" />
            </div>
            <span
              className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                pendingClaimsCount > 0
                  ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
              }`}
            >
              <span>{pendingClaimsCount > 0 ? '검수 대기' : '정상'}</span>
            </span>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
              <span>취소 / 반품 요청</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
              {pendingClaimsCount}
              <span className="text-base font-bold ml-1 text-slate-500">건</span>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span>반품 {pendingReturnsCount}건</span>
            <span>·</span>
            <span>취소 {pendingCancelsCount}건</span>
          </div>
        </Link>

        {/* KPI 4: 1:1 고객 문의 대기 */}
        <Link
          href="/admin/inquiries"
          className="group p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 hover:border-indigo-500/60 hover:shadow-md transition-all block"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
            <span
              className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                pendingInquiriesCount > 0
                  ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
              }`}
            >
              <span>{pendingInquiriesCount > 0 ? '답변 대기' : '완료'}</span>
            </span>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
              <span>미답변 CS 문의</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
              {pendingInquiriesCount}
              <span className="text-base font-bold ml-1 text-slate-500">건</span>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span>총 접수: {totalInquiriesCount}건</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold group-hover:underline">
              답변 바로가기
            </span>
          </div>
        </Link>
      </div>

      {/* 4. 최근 주문 및 답변 대기 1:1 문의 2열 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 좌측 2열: 최근 실시간 주문 현황 (5건) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                최근 실시간 주문 내역
              </h2>
            </div>
            <Link
              href="/admin/claims"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>주문/클레임 전체보기</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              최근 발생한 주문 내역이 없습니다.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {recentOrders.map((order) => {
                const style = STATUS_STYLE_MAP[order.status as keyof typeof STATUS_STYLE_MAP] || {
                  bg: 'bg-slate-100',
                  text: 'text-slate-700',
                  border: 'border-slate-200',
                };
                const formattedDate = new Date(order.createdAt).toLocaleDateString('ko-KR', {
                  month: 'numeric',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={order.id}
                    className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono text-slate-400">{order.orderNumber}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-400">{formattedDate}</span>
                      </div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {order.orderName}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 text-right">
                      <div>
                        <div className="text-sm font-black text-slate-900 dark:text-white">
                          {order.totalPaidAmount.toLocaleString()}원
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {order.paymentMethodLabel}
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${style.bg} ${style.text} ${style.border}`}
                      >
                        {order.statusLabel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 우측 1열: 답변 대기 중인 1:1 고객 문의 위젯 (3건) */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                답변 대기 문의
              </h2>
            </div>
            <Link
              href="/admin/inquiries"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>전체보기</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentPendingInquiries.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-80" />
              <span>모든 1:1 고객 문의에 답변이 완료되었습니다.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPendingInquiries.map((inquiry) => {
                const formattedDate = new Date(inquiry.createdAt).toLocaleDateString('ko-KR', {
                  month: 'numeric',
                  day: 'numeric',
                });

                return (
                  <Link
                    key={inquiry.id}
                    href="/admin/inquiries"
                    className="block p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 hover:border-indigo-500/50 hover:bg-white dark:hover:bg-slate-800 transition-all space-y-2 group"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
                        {inquiry.categoryLabel}
                      </span>
                      <span className="text-slate-400 text-[11px] font-mono">
                        {formattedDate}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {inquiry.title}
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                      {inquiry.content}
                    </div>

                    <div className="pt-1 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">{inquiry.customerName}</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold group-hover:underline flex items-center gap-0.5">
                        <span>답변하기</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
