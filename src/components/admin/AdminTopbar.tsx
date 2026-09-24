'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Menu,
  User,
  LogOut,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { signOutAction } from '@/app/actions/auth.actions';
import { ADMIN_NAV_ITEMS } from './AdminSidebar';

interface AdminTopbarProps {
  onToggleMobileSidebar: () => void;
  adminUser?: {
    name: string;
    email: string;
    role: string;
  } | null;
}

export function AdminTopbar({ onToggleMobileSidebar, adminUser }: AdminTopbarProps) {
  const pathname = usePathname();

  // 현재 라우트에 따른 페이지 타이틀 계산
  const currentNav = ADMIN_NAV_ITEMS.find((item) => {
    if (item.href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(item.href);
  });

  const pageTitle = currentNav?.label || '관리자 콘솔';

  return (
    <header className="h-16 sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4 transition-colors">
      {/* 좌측: 모바일 햄버거 메뉴 및 현재 페이지 브레드크럼 */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden cursor-pointer"
          aria-label="메뉴 열기"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <Link
            href="/admin"
            className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 font-medium transition-colors"
          >
            Admin
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-bold text-slate-900 dark:text-white truncate">
            {pageTitle}
          </span>
        </div>
      </div>

      {/* 우측: 쇼핑몰 바로가기, 관리자 프로필, 로그아웃 */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* 쇼핑몰 프론트 링크 */}
        <Link
          href="/"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <span>스토어 보기</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>

        {/* 관리자 프로필 뱃지 */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
          <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[100px] sm:max-w-none">
                {adminUser?.name || '시스템 관리자'}
              </span>
              <span className="px-1.5 py-0.2 rounded-md bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase">
                {adminUser?.role || 'ADMIN'}
              </span>
            </div>
            {adminUser?.email && (
              <span className="text-[10px] text-slate-400 truncate max-w-[120px] hidden md:inline">
                {adminUser.email}
              </span>
            )}
          </div>
        </div>

        {/* 로그아웃 버튼 */}
        <form action={signOutAction} className="inline">
          <button
            type="submit"
            aria-label="관리자 로그아웃"
            title="로그아웃"
            className="p-2 rounded-xl text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </form>
      </div>
    </header>
  );
}

