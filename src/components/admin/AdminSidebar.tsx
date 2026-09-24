'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  RotateCcw,
  MessageSquare,
  ShoppingBag,
  Package,
  FolderTree,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  X,
} from 'lucide-react';

export interface AdminNavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { id: 'dashboard', label: '대시보드', href: '/admin', icon: LayoutDashboard },
  { id: 'claims', label: '클레임 및 반품', href: '/admin/claims', icon: RotateCcw },
  { id: 'inquiries', label: '1:1 문의 관리', href: '/admin/inquiries', icon: MessageSquare },
  { id: 'orders', label: '주문 / 배송 관리', href: '/admin/orders', icon: ShoppingBag },
  { id: 'products', label: '상품 관리', href: '/admin/products', icon: Package },
  { id: 'categories', label: '카테고리 관리', href: '/admin/categories', icon: FolderTree },
  { id: 'users', label: '회원 관리', href: '/admin/users', icon: Users },
  { id: 'settings', label: '환경설정', href: '/admin/settings', icon: Settings },
];

interface AdminSidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function AdminSidebar({
  isMobileOpen,
  onMobileClose,
  isCollapsed,
  onToggleCollapse,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const isItemActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* 1. 모바일 오버레이 배경 */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs md:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* 2. 사이드바 본체 */}
      <aside
        aria-label="관리자 내비게이션"
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-slate-900 border-r border-slate-800 text-slate-300 transition-all duration-300 ease-in-out md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'w-20' : 'w-64'}`}
      >
        {/* 상단 로고 & 타이틀 헤더 */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800">
          <Link
            href="/admin"
            className="flex items-center gap-3 overflow-hidden group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="font-extrabold text-sm text-white tracking-tight leading-tight">
                  CommerceHub
                </span>
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
                  Admin Console
                </span>
              </div>
            )}
          </Link>

          {/* 모바일 닫기 버튼 */}
          <button
            type="button"
            onClick={onMobileClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden cursor-pointer"
            aria-label="사이드바 닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 내비게이션 링크 목록 */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item.href);

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={onMobileClose}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  active
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform ${
                    active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                {!isCollapsed && (
                  <span className="truncate flex-1">{item.label}</span>
                )}
                {!isCollapsed && item.badge && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* 하단 유틸리티 & 접기 버튼 */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          {/* 쇼핑몰 프론트 바로가기 */}
          <Link
            href="/"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            title="쇼핑몰 메인으로 이동"
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>쇼핑몰 바로가기</span>}
          </Link>

          {/* 데스크톱 사이드바 접기/펼치기 토글 */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-full hidden md:flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label={isCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
            title={isCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <div className="flex items-center gap-2 text-xs font-medium">
                <ChevronLeft className="w-4 h-4" />
                <span>사이드바 접기</span>
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

