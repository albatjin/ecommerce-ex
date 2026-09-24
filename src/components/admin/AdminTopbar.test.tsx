import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminTopbar } from './AdminTopbar';

let mockPathname = '/admin';

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

vi.mock('@/app/actions/auth.actions', () => ({
  signOutAction: vi.fn(),
}));

describe('AdminTopbar Component', () => {
  const defaultProps = {
    onToggleMobileSidebar: vi.fn(),
    adminUser: {
      name: '최고관리자',
      email: 'superadmin@commercehub.internal',
      role: 'SUPER_ADMIN',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = '/admin';
  });

  it('현재 경로에 맞는 페이지 타이틀 및 브레드크럼을 렌더링한다', () => {
    mockPathname = '/admin/claims';
    render(<AdminTopbar {...defaultProps} />);

    expect(screen.getByText('Admin')).toBeDefined();
    expect(screen.getByText('클레임 및 반품')).toBeDefined();
  });

  it('관리자 정보(이름, 역할 뱃지, 이메일)를 올바르게 표시한다', () => {
    render(<AdminTopbar {...defaultProps} />);

    expect(screen.getByText('최고관리자')).toBeDefined();
    expect(screen.getByText('SUPER_ADMIN')).toBeDefined();
    expect(screen.getByText('superadmin@commercehub.internal')).toBeDefined();
  });

  it('모바일 햄버거 메뉴 버튼 클릭 시 onToggleMobileSidebar가 호출된다', () => {
    render(<AdminTopbar {...defaultProps} />);

    const menuButton = screen.getByRole('button', { name: /메뉴 열기/i });
    fireEvent.click(menuButton);

    expect(defaultProps.onToggleMobileSidebar).toHaveBeenCalledTimes(1);
  });

  it('스토어 바로가기 링크와 로그아웃 버튼이 존재한다', () => {
    render(<AdminTopbar {...defaultProps} />);

    expect(screen.getByText('스토어 보기')).toBeDefined();
    expect(screen.getByRole('button', { name: /관리자 로그아웃/i })).toBeDefined();
  });
});

