import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import {
  UserCircle,
  Coins,
  Ticket,
  PackageCheck,
  ChevronRight,
  Award,
} from 'lucide-react';
import { SupabaseUserRepository } from '@/core/infrastructure/repositories/SupabaseUserRepository';
import { GetCurrentUserUseCase } from '@/core/application/auth';
import { getOrderAction } from '@/app/actions/order.actions';
import { OrderDetailViewer } from '@/components/user';

export const metadata: Metadata = {
  title: '주문 상세 조회 | 마이페이지 | CommerceHub',
  description: '주문 상세 품목, 결제 내역 및 배송 추적 정보를 확인하세요.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface MyOrderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function MyOrderDetailPage({
  params,
}: MyOrderDetailPageProps) {
  const { id } = await params;

  const userRepository = new SupabaseUserRepository();
  const getCurrentUserUseCase = new GetCurrentUserUseCase(userRepository);
  const user = await getCurrentUserUseCase.execute();

  if (!user) {
    redirect(`/login?redirect=%2Fmy-page%2Forders%2F${id}`);
  }

  const result = await getOrderAction({ orderId: id });
  if (!result.success || !result.data) {
    notFound();
  }

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
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/30 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <UserCircle className="w-10 h-10" />
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

      {/* 2. 탭 내비게이션 & 주문 상세 본체 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* 마이페이지 사이드바 메뉴 */}
        <div className="space-y-2">
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
              className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 font-semibold text-sm"
            >
              <span>주문 / 배송 조회</span>
              <ChevronRight className="w-4 h-4" />
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

          <div className="p-4 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
              <Award className="w-4 h-4 text-amber-500" />
              <span>현재 등급: {user.membershipGrade}</span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              누적 구매금액: <span className="font-semibold text-slate-700 dark:text-slate-300">{user.totalSpent.toLocaleString()}원</span>
            </p>
          </div>
        </div>

        {/* 메인 주문 상세 본체 */}
        <div className="md:col-span-3">
          <OrderDetailViewer order={result.data} />
        </div>
      </div>
    </div>
  );
}

