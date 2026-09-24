import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  UserCircle,
  Coins,
  Ticket,
  PackageCheck,
  ChevronRight,
  RotateCcw,
  MessageSquare,
} from 'lucide-react';
import { SupabaseUserRepository } from '@/core/infrastructure/repositories/SupabaseUserRepository';
import { GetCurrentUserUseCase } from '@/core/application/auth';
import { getUserOrdersAction } from '@/app/actions/order.actions';
import { OrderListViewer } from '@/components/user';

export const metadata: Metadata = {
  title: '취소 및 반품 내역 | 마이페이지 | CommerceHub',
  description: '주문 취소 및 반품/환불 처리 상태를 확인하세요.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MyClaimsPage() {
  const userRepository = new SupabaseUserRepository();
  const getCurrentUserUseCase = new GetCurrentUserUseCase(userRepository);
  const user = await getCurrentUserUseCase.execute();

  if (!user) {
    redirect('/login?redirect=%2Fmy-page%2Fclaims');
  }

  const ordersResult = await getUserOrdersAction({ limit: 50 });
  const orders = ordersResult.success && ordersResult.data ? ordersResult.data.orders : [];
  const totalCount = ordersResult.success && ordersResult.data ? ordersResult.data.totalCount : 0;

  const gradeColors: Record<string, string> = {
    BRONZE: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-400',
    SILVER: 'bg-slate-200 text-slate-800 border-slate-400 dark:bg-slate-800 dark:text-slate-300',
    GOLD: 'bg-yellow-100 text-yellow-800 border-yellow-400 dark:bg-yellow-950/60 dark:text-yellow-400',
    VIP: 'bg-purple-100 text-purple-800 border-purple-400 dark:bg-purple-950/60 dark:text-purple-400',
    VVIP: 'bg-rose-100 text-rose-800 border-rose-400 dark:bg-rose-950/60 dark:text-rose-400',
  };

  return (
    <div className="container-custom py-8 sm:py-12 space-y-8">
      {/* 1. 상단 회원 요약 카드 */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-600/30 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <RotateCcw className="w-10 h-10" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl sm:text-2xl font-bold tracking-tight">{user.name}님</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase border ${
                  gradeColors[user.membershipGrade] || gradeColors.BRONZE
                }`}
              >
                {user.membershipGrade}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              고객번호: <span className="font-mono text-slate-300">{user.customerNumber}</span> | {user.email}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-6 bg-white/5 p-4 rounded-2xl border border-white/10 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>적립금</span>
            </div>
            <div className="text-base sm:text-lg font-black text-amber-400">
              {user.rewardPoints.toLocaleString()}P
            </div>
          </div>
          <div className="border-x border-white/10 px-2 sm:px-4">
            <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
              <Ticket className="w-3.5 h-3.5 text-blue-400" />
              <span>쿠폰</span>
            </div>
            <div className="text-base sm:text-lg font-black text-blue-400">
              {user.couponsCount}장
            </div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
              <PackageCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>주문</span>
            </div>
            <div className="text-base sm:text-lg font-black text-emerald-400">
              {user.totalOrders}건
            </div>
          </div>
        </div>
      </div>

      {/* 2. 탭 내비게이션 & 메인 클레임 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* 마이페이지 사이드바 메뉴 */}
        <div className="space-y-4">
          <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
            <Link
              href="/my-page"
              className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium text-sm transition-colors"
            >
              <span>회원정보 수정</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
            <Link
              href="/my-page/orders"
              className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium text-sm transition-colors"
            >
              <span>주문 / 배송 조회</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
            <Link
              href="/my-page/claims"
              className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-semibold text-sm"
            >
              <span>취소 / 반품 내역</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href="/my-page/inquiries"
              className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium text-sm transition-colors"
            >
              <span>1:1 고객 문의</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
            <Link
              href="/my-page/coupons"
              className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium text-sm transition-colors"
            >
              <span>쿠폰함 ({user.couponsCount})</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
            <Link
              href="/my-page/points"
              className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium text-sm transition-colors"
            >
              <span>적립금 내역</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>

          {/* 관리 콘솔 바로가기 */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-1">
            <div className="px-3 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
              관리 콘솔 바로가기
            </div>
            <Link
              href="/admin/claims"
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <span>클레임 관리</span>
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            </Link>
            <Link
              href="/admin/inquiries"
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <span>1:1 문의 관리</span>
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>
        </div>

        {/* 클레임 기본 탭으로 열리는 주문 리스트 */}
        <div className="md:col-span-3">
          <OrderListViewer initialOrders={orders} totalCount={totalCount} initialTab="CANCELLED" />
        </div>
      </div>
    </div>
  );
}
