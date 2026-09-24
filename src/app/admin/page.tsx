import { Metadata } from 'next';
import Link from 'next/link';
import {
  RotateCcw,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  Package,
  Layers,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import { getAdminOrdersAction } from '@/app/actions/order.actions';
import { getAdminInquiriesAction } from '@/app/actions/inquiry.actions';

export const metadata: Metadata = {
  title: '관리자 콘솔 대시보드 | CommerceHub',
  description: '주문, 클레임 및 CS 문의 관리 콘솔',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDashboardPage() {
  const claimsResult = await getAdminOrdersAction({ filterType: 'CLAIMS_ALL', limit: 100 });
  const inquiriesResult = await getAdminInquiriesAction();

  const claimOrders = claimsResult.data?.orders || [];
  const pendingReturns = claimOrders.filter((o) => o.status === 'RETURN_REQUESTED').length;
  const pendingCancels = claimOrders.filter((o) => o.status === 'CANCEL_REQUESTED').length;

  const inquiries = inquiriesResult.data?.inquiries || [];
  const pendingInquiries = inquiries.filter((i) => i.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* 헤더 배너 */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-black tracking-tight">CommerceHub 관리자 콘솔</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  ADMIN
                </span>
              </div>
              <p className="text-sm text-slate-400">
                주문 클레임(취소/반품/환불) 및 고객 1:1 CS 문의를 통합 관리합니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <span>쇼핑몰 바로가기</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 핵심 작업 바로가기 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 카드 1: 클레임 및 반품 관리 */}
          <Link
            href="/admin/claims"
            className="group p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-500/50 hover:shadow-lg transition-all space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <RotateCcw className="w-6 h-6" />
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
            </div>

            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                클레임 및 반품 관리
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                고객의 주문 취소 및 반품 요청 건을 검수하고, 승인 또는 반려 처리합니다.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">반품 대기:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{pendingReturns}건</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">취소 대기:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">{pendingCancels}건</span>
              </div>
            </div>
          </Link>

          {/* 카드 2: 1:1 고객 문의 답변 관리 */}
          <Link
            href="/admin/inquiries"
            className="group p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-500/50 hover:shadow-lg transition-all space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <MessageSquare className="w-6 h-6" />
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
            </div>

            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                1:1 문의 답변 관리
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                고객이 남긴 1:1 문의 내역을 확인하고 실시간 공식 답변을 등록합니다.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">답변 대기:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{pendingInquiries}건</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">총 문의 접수:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{inquiries.length}건</span>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
