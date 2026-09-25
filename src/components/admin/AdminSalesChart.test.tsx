import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminSalesChart } from './AdminSalesChart';
import type { AdminSalesAnalyticsDTO } from '@/core/application/admin/dtos/AdminSalesAnalyticsDTO';

const mockGetAdminSalesAnalyticsAction = vi.fn();

vi.mock('@/app/actions/admin.actions', () => ({
  getAdminSalesAnalyticsAction: (...args: any[]) => mockGetAdminSalesAnalyticsAction(...args),
}));

describe('AdminSalesChart Component', () => {
  const sampleAnalytics: AdminSalesAnalyticsDTO = {
    period: '7d',
    dailyTrend: [
      { date: '2026-09-19', label: '9/19 (토)', sales: 50000, orderCount: 1 },
      { date: '2026-09-20', label: '9/20 (일)', sales: 70000, orderCount: 2 },
      { date: '2026-09-21', label: '9/21 (월)', sales: 120000, orderCount: 3 },
      { date: '2026-09-22', label: '9/22 (화)', sales: 90000, orderCount: 2 },
      { date: '2026-09-23', label: '9/23 (수)', sales: 150000, orderCount: 4 },
      { date: '2026-09-24', label: '9/24 (목)', sales: 200000, orderCount: 5 },
      { date: '2026-09-25', label: '9/25 (금)', sales: 250000, orderCount: 6 },
    ],
    totalPeriodSales: 930000,
    averageDailySales: 132857,
    maxDailySales: 250000,
    statusPipeline: [],
    totalOrdersInPipeline: 23,
    generatedAt: '2026-09-25T12:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('차트 헤더 및 기간 요약 지표(총매출, 일평균, 최고매출일)를 정상 렌더링한다', () => {
    render(<AdminSalesChart initialData={sampleAnalytics} />);

    expect(screen.getByText('일별 매출 추이 분석')).toBeDefined();
    expect(screen.getByText('930,000원')).toBeDefined();
    expect(screen.getByText('132,857원')).toBeDefined();
    expect(screen.getByText('250,000원')).toBeDefined();
  });

  it('최근 30일 버튼 클릭 시 Server Action을 호출하여 30일 데이터를 로드한다', async () => {
    const updatedAnalytics: AdminSalesAnalyticsDTO = {
      ...sampleAnalytics,
      period: '30d',
      totalPeriodSales: 4500000,
    };

    mockGetAdminSalesAnalyticsAction.mockResolvedValueOnce({
      success: true,
      data: updatedAnalytics,
    });

    render(<AdminSalesChart initialData={sampleAnalytics} />);

    const button30d = screen.getByRole('button', { name: /최근 30일/i });
    fireEvent.click(button30d);

    await waitFor(() => {
      expect(mockGetAdminSalesAnalyticsAction).toHaveBeenCalledWith('30d');
      expect(screen.getByText('4,500,000원')).toBeDefined();
    });
  });

  it('마우스를 차트 막대에 올렸을 때 툴팁에 상세 일자, 주문 건수, 매출액이 표시된다', () => {
    const { container } = render(<AdminSalesChart initialData={sampleAnalytics} />);

    const barGroups = container.querySelectorAll('.group.cursor-pointer');
    expect(barGroups.length).toBe(7);

    // 마지막 날(2026-09-25)에 마우스 진입
    fireEvent.mouseEnter(barGroups[6]);

    expect(screen.getByText('9/25 (금)')).toBeDefined();
    expect(screen.getAllByText('250,000원')).toHaveLength(2);
    expect(screen.getByText('6')).toBeDefined();
  });
});
