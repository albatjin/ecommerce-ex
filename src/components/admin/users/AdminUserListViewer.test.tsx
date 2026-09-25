import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminUserListViewer } from './AdminUserListViewer';
import type { AdminUserSummaryDTO } from '@/core/application/user/dto/admin-user.dto';

const mockUpdateStatusGrade = vi.fn();
const mockGrantPoints = vi.fn();
const mockIssueCoupon = vi.fn();

vi.mock('@/app/actions/user-admin.actions', () => ({
  updateUserStatusAndGradeAction: (...args: unknown[]) => mockUpdateStatusGrade(...args),
  grantUserPointsAction: (...args: unknown[]) => mockGrantPoints(...args),
  issueUserCouponAction: (...args: unknown[]) => mockIssueCoupon(...args),
}));

const mockUsers: AdminUserSummaryDTO[] = [
  {
    id: 'user-1',
    customerNumber: 'CUST-00001',
    email: 'hong@example.com',
    name: '홍길동',
    phone: '010-1234-5678',
    role: 'customer',
    membershipGrade: 'BRONZE',
    status: 'ACTIVE',
    totalSpent: 50000,
    totalOrders: 2,
    rewardPoints: 1000,
    couponsCount: 1,
    createdAt: '2026-09-01T00:00:00Z',
  },
  {
    id: 'user-2',
    customerNumber: 'CUST-00002',
    email: 'kim@example.com',
    name: '김영희',
    phone: '010-9876-5432',
    role: 'manager',
    membershipGrade: 'VIP',
    status: 'ACTIVE',
    totalSpent: 1500000,
    totalOrders: 15,
    rewardPoints: 25000,
    couponsCount: 3,
    createdAt: '2026-09-02T00:00:00Z',
  },
  {
    id: 'user-3',
    customerNumber: 'CUST-00003',
    email: 'dormant@example.com',
    name: '휴면회원',
    phone: '010-1111-2222',
    role: 'customer',
    membershipGrade: 'BRONZE',
    status: 'DORMANT',
    totalSpent: 0,
    totalOrders: 0,
    rewardPoints: 0,
    couponsCount: 0,
    createdAt: '2026-09-03T00:00:00Z',
  },
];

describe('AdminUserListViewer Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('회원 목록과 상단 KPI 통계 카드를 정상적으로 렌더링한다', () => {
    render(<AdminUserListViewer initialUsers={mockUsers} totalCount={3} />);

    expect(screen.getByText('회원 통합 관리 (CMS)')).toBeInTheDocument();
    expect(screen.getByText('홍길동')).toBeInTheDocument();
    expect(screen.getByText('김영희')).toBeInTheDocument();
    expect(screen.getByText('휴면회원')).toBeInTheDocument();
  });

  it('이름으로 검색 시 일치하는 회원만 표시된다', () => {
    render(<AdminUserListViewer initialUsers={mockUsers} totalCount={3} />);

    const searchInput = screen.getByPlaceholderText(/이름, 이메일, 회원코드 검색/i);
    fireEvent.change(searchInput, { target: { value: '김영희' } });

    expect(screen.getByText('김영희')).toBeInTheDocument();
    expect(screen.queryByText('홍길동')).not.toBeInTheDocument();
    expect(screen.queryByText('불량회원')).not.toBeInTheDocument();
  });

  it('등급 필터 선택 시 해당 등급 회원만 필터링된다', () => {
    render(<AdminUserListViewer initialUsers={mockUsers} totalCount={3} />);

    const gradeSelect = screen.getByLabelText('회원 등급 필터');
    fireEvent.change(gradeSelect, { target: { value: 'VIP' } });

    expect(screen.getByText('김영희')).toBeInTheDocument();
    expect(screen.queryByText('홍길동')).not.toBeInTheDocument();
    expect(screen.queryByText('불량회원')).not.toBeInTheDocument();
  });

  it('상태 탭(휴면) 클릭 시 휴면 회원만 표시된다', () => {
    render(<AdminUserListViewer initialUsers={mockUsers} totalCount={3} />);

    const dormantTab = screen.getByRole('button', { name: /휴면 \(1\)/i });
    fireEvent.click(dormantTab);

    expect(screen.getByText('휴면회원')).toBeInTheDocument();
    expect(screen.queryByText('홍길동')).not.toBeInTheDocument();
    expect(screen.queryByText('김영희')).not.toBeInTheDocument();
  });

  it('상태/등급 변경 버튼 클릭 시 모달이 열리고 updateUserStatusAndGradeAction이 호출된다', async () => {
    mockUpdateStatusGrade.mockResolvedValueOnce({
      success: true,
      data: {
        ...mockUsers[0],
        membershipGrade: 'GOLD',
        status: 'ACTIVE',
      },
    });

    render(<AdminUserListViewer initialUsers={mockUsers} totalCount={3} />);

    const editBtn = screen.getByLabelText('회원 홍길동 상태 및 등급 변경');
    fireEvent.click(editBtn);

    expect(screen.getByText('회원 상태 및 등급 변경', { selector: 'h2' })).toBeInTheDocument();

    const saveBtn = screen.getByRole('button', { name: '변경사항 저장' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockUpdateStatusGrade).toHaveBeenCalledTimes(1);
    });
  });

  it('적립금 지급 버튼 클릭 시 모달이 열리고 grantUserPointsAction이 호출된다', async () => {
    mockGrantPoints.mockResolvedValueOnce({
      success: true,
      data: {
        userId: 'user-1',
        amount: 3000,
        newBalance: 4000,
      },
    });

    render(<AdminUserListViewer initialUsers={mockUsers} totalCount={3} />);

    const pointBtn = screen.getByLabelText('회원 홍길동 적립금 지급');
    fireEvent.click(pointBtn);

    expect(screen.getByText('적립금(포인트) 수동 지급', { selector: 'h2' })).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: '적립금 즉시 지급' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockGrantPoints).toHaveBeenCalledTimes(1);
    });
  });

  it('쿠폰 발급 버튼 클릭 시 모달이 열리고 issueUserCouponAction이 호출된다', async () => {
    mockIssueCoupon.mockResolvedValueOnce({
      success: true,
      data: {
        couponId: 'coup-1',
        userId: 'user-1',
        name: '관리자 발급 감사 10% 할인 쿠폰',
        discountSummary: '10% 할인',
      },
    });

    render(<AdminUserListViewer initialUsers={mockUsers} totalCount={3} />);

    const couponBtn = screen.getByLabelText('회원 홍길동 쿠폰 발급');
    fireEvent.click(couponBtn);

    expect(screen.getByText('전용 쿠폰 수동 발급', { selector: 'h2' })).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: '쿠폰 즉시 발급' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockIssueCoupon).toHaveBeenCalledTimes(1);
    });
  });
});
