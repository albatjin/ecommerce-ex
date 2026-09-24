import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminSidebar } from './AdminSidebar';

let mockPathname = '/admin';

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

describe('AdminSidebar Component', () => {
  const defaultProps = {
    isMobileOpen: false,
    onMobileClose: vi.fn(),
    isCollapsed: false,
    onToggleCollapse: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = '/admin';
  });

  it('사이드바의 핵심 메뉴 아이템들을 정상 렌더링한다', () => {
    render(<AdminSidebar {...defaultProps} />);

    expect(screen.getByText('대시보드')).toBeDefined();
    expect(screen.getByText('클레임 및 반품')).toBeDefined();
    expect(screen.getByText('1:1 문의 관리')).toBeDefined();
    expect(screen.getByText('주문 / 배송 관리')).toBeDefined();
    expect(screen.getByText('상품 관리')).toBeDefined();
    expect(screen.getByText('카테고리 관리')).toBeDefined();
    expect(screen.getByText('회원 관리')).toBeDefined();
    expect(screen.getByText('환경설정')).toBeDefined();
    expect(screen.getByText('쇼핑몰 바로가기')).toBeDefined();
  });

  it('현재 경로에 해당하는 메뉴 항목에 활성 스타일이 적용된다', () => {
    mockPathname = '/admin/claims';
    render(<AdminSidebar {...defaultProps} />);

    const claimsLink = screen.getByText('클레임 및 반품').closest('a');
    expect(claimsLink?.className).toContain('bg-indigo-600');
  });

  it('접기 버튼 클릭 시 onToggleCollapse 콜백이 호출된다', () => {
    render(<AdminSidebar {...defaultProps} isCollapsed={false} />);

    const collapseButton = screen.getByRole('button', { name: /사이드바 접기/i });
    fireEvent.click(collapseButton);

    expect(defaultProps.onToggleCollapse).toHaveBeenCalledTimes(1);
  });

  it('모바일 오버레이가 열렸을 때 배경을 클릭하면 onMobileClose가 호출된다', () => {
    const { container } = render(<AdminSidebar {...defaultProps} isMobileOpen={true} />);

    const overlay = container.querySelector('.bg-slate-950\\/60');
    expect(overlay).toBeDefined();

    if (overlay) {
      fireEvent.click(overlay);
      expect(defaultProps.onMobileClose).toHaveBeenCalledTimes(1);
    }
  });
});

