'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, User, Search, Menu, UserPlus, LogOut, X, ShieldCheck, LayoutDashboard } from 'lucide-react';
import { signOutAction } from '@/app/actions/auth.actions';
import { CategoryDropdown } from '@/components/catalog/CategoryDropdown';
import { useCart } from '@/components/cart/CartContext';
import type { CategoryTreeNode } from '@/core/application/catalog/dtos/CategoryTreeDTO';

interface HeaderProps {
  cartItemCount?: number;
  userName?: string | null;
  isAdmin?: boolean;
  categories?: CategoryTreeNode[];
}

export function Header({
  cartItemCount = 0,
  userName,
  isAdmin = false,
  categories,
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { cart, openDrawer } = useCart();
  const displayCount = cart ? cart.totalItemCount : cartItemCount;
  const displayUserName =
    userName === 'albat77' || userName === 'albat77@nate.com'
      ? 'admin'
      : userName;
  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* 1. 최상단 유틸리티 공지 & 인증 바 */}
      <div className="bg-slate-900 text-slate-200 text-xs py-2.5 px-4 hidden sm:block">
        <div className="container-custom flex justify-between items-center">
          {/* 왼쪽 칼라 메뉴는 그대로 유지 */}
          <p className="font-medium tracking-wide">
            🎉 신규 회원 가입 시 <span className="text-amber-400 font-bold">3,000원 웰컴 적립금</span> 즉시 지급!
          </p>

          {/* 오른쪽 화면에 배치된 메뉴: 밝고 선명한 밝은색으로 가독성 대폭 향상 */}
          <div className="flex items-center gap-3.5 text-xs text-slate-200 font-medium">
            {isAdmin && (
              <>
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 text-amber-300 hover:text-amber-100 font-bold bg-amber-500/25 px-2.5 py-1 rounded-md border border-amber-400/50 transition-colors shadow-xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                  관리자 콘솔
                </Link>
                <span className="text-slate-600 font-light">|</span>
                <Link href="/admin/claims" className="text-amber-300/90 hover:text-amber-100 font-semibold transition-colors">
                  클레임관리
                </Link>
                <span className="text-slate-600 font-light">|</span>
                <Link href="/admin/inquiries" className="text-amber-300/90 hover:text-amber-100 font-semibold transition-colors">
                  문의관리
                </Link>
                <span className="text-slate-600 font-light">|</span>
              </>
            )}

            {userName ? (
              <>
                <span className="text-slate-100 font-semibold">
                  <span className="text-sky-300 font-bold">{displayUserName}</span>님
                </span>
                <span className="text-slate-600 font-light">|</span>
                <Link href="/my-page" className="text-slate-200 hover:text-white transition-colors">
                  마이페이지
                </Link>
                <span className="text-slate-600 font-light">|</span>
                <form action={signOutAction} className="inline">
                  <button type="submit" className="text-slate-200 hover:text-white transition-colors cursor-pointer">
                    로그아웃
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className="text-slate-200 hover:text-white transition-colors font-medium">
                  로그인
                </Link>
                <span className="text-slate-600 font-light">|</span>
                <Link href="/signup" className="text-sky-300 hover:text-sky-200 font-bold transition-colors">
                  회원가입
                </Link>
              </>
            )}

            <span className="text-slate-600 font-light">|</span>
            <Link href="/my-page/orders" className="text-slate-200 hover:text-white transition-colors">
              주문/배송
            </Link>
            <span className="text-slate-600 font-light">|</span>
            <Link href="/my-page/claims" className="text-slate-200 hover:text-white transition-colors">
              취소/반품
            </Link>
            <span className="text-slate-600 font-light">|</span>
            <Link href="/my-page/inquiries" className="text-slate-200 hover:text-white transition-colors">
              1:1 문의
            </Link>
            <span className="text-slate-600 font-light">|</span>
            <Link href="/support" className="text-slate-200 hover:text-white transition-colors">
              고객센터
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
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="p-2 -ml-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden cursor-pointer"
            aria-label="모바일 메뉴 열기"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/" className="flex items-center gap-2 group">
            <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-sm group-hover:bg-blue-700 transition-colors">
              A
            </span>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white leading-tight">
                aramdream <span className="text-blue-600">store</span>
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
                <span className="hidden sm:inline">{displayUserName}님</span>
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

          {/* 관리자 콘솔 바로가기 (관리자 권한인 경우 눈에 띄게 노출) */}
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:hover:bg-amber-900 border border-amber-300 dark:border-amber-700/60 transition-colors shadow-xs"
              title="관리자 콘솔 대시보드로 이동"
            >
              <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline">관리자 콘솔</span>
            </Link>
          )}

          {/* 장바구니 아이콘 & 카운트 배지 */}
          <button
            type="button"
            onClick={openDrawer}
            className="relative p-2.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="장바구니"
          >
            <ShoppingBag className="w-5 h-5" />
            {displayCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                {displayCount > 99 ? '99+' : displayCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 3. 하단 GNB 내비게이션 바 (데스크톱) */}
      <nav className="border-t border-slate-100 dark:border-slate-800/60 hidden md:block">
        <div className="container-custom flex items-center justify-between py-2">
          <div className="flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            {/* 전체 카테고리 드롭다운 */}
            <CategoryDropdown categories={categories} />

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

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

          {/* 데스크톱 GNB 우측 관리자 대시보드 배지 탭 */}
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm transition-all"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>관리자 대시보드</span>
            </Link>
          )}
        </div>
      </nav>

      {/* 4. 모바일 내비게이션 드로어 */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-4 animate-in slide-in-from-top-2 duration-150">
          {/* 모바일 관리자 빠른 접속 카드 */}
          {isAdmin && (
            <div className="p-3 bg-linear-to-r from-amber-500/15 via-amber-500/5 to-transparent rounded-xl border border-amber-300 dark:border-amber-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" /> 관리자 모드
                </span>
                <Link
                  href="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline"
                >
                  대시보드 바로가기 →
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-1.5 pt-1 text-xs">
                <Link
                  href="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-1.5 px-2 rounded-lg bg-white dark:bg-slate-800 font-semibold text-slate-800 dark:text-slate-200 border border-amber-200 dark:border-amber-800/40 text-center hover:bg-amber-50"
                >
                  대시보드
                </Link>
                <Link
                  href="/admin/claims"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-1.5 px-2 rounded-lg bg-white dark:bg-slate-800 font-semibold text-slate-800 dark:text-slate-200 border border-amber-200 dark:border-amber-800/40 text-center hover:bg-amber-50"
                >
                  클레임
                </Link>
                <Link
                  href="/admin/inquiries"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-1.5 px-2 rounded-lg bg-white dark:bg-slate-800 font-semibold text-slate-800 dark:text-slate-200 border border-amber-200 dark:border-amber-800/40 text-center hover:bg-amber-50"
                >
                  1:1 문의
                </Link>
              </div>
            </div>
          )}

          <form action="/products" method="GET" className="relative">
            <input
              type="text"
              name="q"
              placeholder="상품 검색"
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-blue-500 focus:outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </form>

          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              카테고리 & 쇼핑
            </p>
            <Link
              href="/products"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
            >
              전체 상품 둘러보기
            </Link>
            <Link
              href="/products?sort=best"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              베스트
            </Link>
            <Link
              href="/products?sort=new"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              신상품
            </Link>
            <Link
              href="/products?filter=discount"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              특가세일
            </Link>
          </div>

          <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              마이페이지 & 고객지원
            </p>
            <Link
              href="/my-page"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              마이페이지
            </Link>
            <Link
              href="/my-page/orders"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              주문 / 배송 조회
            </Link>
            <Link
              href="/my-page/claims"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            >
              취소 / 반품 내역
            </Link>
            <Link
              href="/my-page/inquiries"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
            >
              1:1 고객 문의
            </Link>
            {isAdmin && (
              <>
                <Link
                  href="/admin/claims"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-bold text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                >
                  [관리자] 클레임 관리
                </Link>
                <Link
                  href="/admin/inquiries"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-bold text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                >
                  [관리자] 1:1 문의 관리
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
