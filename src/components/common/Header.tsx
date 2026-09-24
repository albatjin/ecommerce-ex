'use client';

import Link from 'next/link';
import { ShoppingBag, User, Search, Menu, UserPlus, LogOut } from 'lucide-react';
import { signOutAction } from '@/app/actions/auth.actions';

interface HeaderProps {
  cartItemCount?: number;
  userName?: string | null;
  isAdmin?: boolean;
}

export function Header({ cartItemCount = 0, userName, isAdmin = false }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* 1. 최상단 유틸리티 공지 & 인증 바 */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 hidden sm:block">
        <div className="container-custom flex justify-between items-center">
          <p className="font-medium tracking-wide">
            🎉 신규 회원 가입 시 <span className="text-amber-400 font-bold">3,000원 웰컴 적립금</span> 즉시 지급!
          </p>
          <div className="flex items-center gap-3.5 text-slate-400 text-[11px]">
            {isAdmin && (
              <Link href="/admin" className="text-amber-400 hover:text-amber-300 font-semibold">
                관리자 콘솔
              </Link>
            )}

            {userName ? (
              <>
                <span className="text-slate-300 font-medium">
                  <span className="text-blue-400 font-bold">{userName}</span>님
                </span>
                <span className="text-slate-700">|</span>
                <Link href="/my-page" className="hover:text-white transition-colors">
                  마이페이지
                </Link>
                <span className="text-slate-700">|</span>
                <form action={signOutAction} className="inline">
                  <button type="submit" className="hover:text-white transition-colors">
                    로그아웃
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className="text-slate-300 hover:text-white transition-colors font-medium">
                  로그인
                </Link>
                <span className="text-slate-700">|</span>
                <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-bold transition-colors">
                  회원가입
                </Link>
              </>
            )}

            <span className="text-slate-700">|</span>
            <Link href="/support" className="hover:text-white transition-colors">
              고객센터
            </Link>
            <span className="text-slate-700">|</span>
            <Link href="/my-page/orders" className="hover:text-white transition-colors">
              배송조회
            </Link>
          </div>
        </div>
      </div>

      {/* 2. 메인 헤더 본체 */}
      <div className="container-custom py-3.5 flex items-center justify-between gap-4">
        {/* 모바일 햄버거 메뉴 버튼 & 브랜드 로고 */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="p-2 -ml-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
            aria-label="모바일 메뉴 열기"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/" className="flex items-center gap-2 group">
            <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-sm group-hover:bg-blue-700 transition-colors">
              C
            </span>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white leading-tight">
                Commerce<span className="text-blue-600">Hub</span>
              </span>
            </div>
          </Link>
        </div>

        {/* 중앙 검색창 */}
        <div className="flex-1 max-w-lg hidden md:block">
          <form action="/products" method="GET" className="relative">
            <input
              type="text"
              name="q"
              placeholder="찾으시는 프리미엄 상품을 검색해 보세요"
              className="w-full pl-10 pr-4 py-2 text-sm rounded-full bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all placeholder:text-slate-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </form>
        </div>

        {/* 우측 유저 액션 버튼들 (로그인, 회원가입, 마이페이지, 장바구니) */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {userName ? (
            <div className="flex items-center gap-1 sm:gap-2">
              <Link
                href="/my-page"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <User className="w-4 h-4 text-slate-500" />
                <span className="hidden sm:inline">{userName}님</span>
              </Link>
              <form action={signOutAction} className="inline">
                <button
                  type="submit"
                  aria-label="로그아웃"
                  className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="로그아웃"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <User className="w-4 h-4 text-slate-500" />
                <span>로그인</span>
              </Link>
              <Link
                href="/signup"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">회원가입</span>
              </Link>
            </div>
          )}

          {/* 장바구니 아이콘 & 카운트 배지 */}
          <Link
            href="/cart"
            className="relative p-2.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="장바구니"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartItemCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                {cartItemCount > 99 ? '99+' : cartItemCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* 3. 하단 GNB 내비게이션 바 */}
      <nav className="border-t border-slate-100 dark:border-slate-800/60 hidden md:block">
        <div className="container-custom flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300 py-2.5">
          <Link href="/products" className="text-blue-600 font-bold hover:underline">
            전체 상품
          </Link>
          <Link href="/products?sort=best" className="hover:text-blue-600 transition-colors">
            베스트
          </Link>
          <Link href="/products?sort=new" className="hover:text-blue-600 transition-colors">
            신상품
          </Link>
          <Link href="/products?filter=discount" className="hover:text-blue-600 transition-colors">
            특가세일
          </Link>
          <Link href="/events" className="hover:text-blue-600 transition-colors">
            기획전
          </Link>
        </div>
      </nav>
    </header>
  );
}
