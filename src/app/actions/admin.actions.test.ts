import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAdminDashboardSummaryAction,
  getAdminSalesAnalyticsAction,
} from './admin.actions';
import { ok, fail } from '@/core/domain/shared/Result';
import { DomainError } from '@/core/domain/shared/AppError';

const mockGetUser = vi.fn();
const mockDashboardExecute = vi.fn();
const mockAnalyticsExecute = vi.fn();

vi.mock('@/core/infrastructure/supabase/server', () => ({
  getServerClient: vi.fn().mockImplementation(async () => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

vi.mock('@/core/infrastructure/repositories/SupabaseOrderRepository', () => ({
  SupabaseOrderRepository: vi.fn(),
}));

vi.mock('@/core/infrastructure/repositories/SupabaseInquiryRepository', () => ({
  SupabaseInquiryRepository: vi.fn(),
}));

vi.mock('@/core/application/admin', () => {
  return {
    GetAdminDashboardSummaryUseCase: class {
      execute = mockDashboardExecute;
    },
    GetAdminSalesAnalyticsUseCase: class {
      execute = mockAnalyticsExecute;
    },
  };
});

describe('admin.actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAdminDashboardSummaryAction', () => {
    it('일반 고객(customer) 역할일 경우 인가 에러를 반환한다', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: {
          user: {
            id: 'cust-1',
            user_metadata: { role: 'customer' },
          },
        },
      });

      const result = await getAdminDashboardSummaryAction();

      expect(result.success).toBe(false);
      expect(result.error).toContain('권한이 없습니다');
    });

    it('관리자 권한인 경우 대시보드 통계 DTO를 성공적으로 반환한다', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: {
          user: {
            id: 'admin-1',
            user_metadata: { role: 'admin' },
          },
        },
      });

      const sampleDTO = {
        totalRevenue: 2500000,
        todayRevenue: 300000,
        totalOrdersCount: 45,
        todayOrdersCount: 6,
        pendingClaimsCount: 3,
        pendingReturnsCount: 2,
        pendingCancelsCount: 1,
        pendingInquiriesCount: 4,
        totalInquiriesCount: 12,
        recentOrders: [],
        recentPendingInquiries: [],
        generatedAt: new Date().toISOString(),
      };

      mockDashboardExecute.mockResolvedValueOnce(ok(sampleDTO));

      const result = await getAdminDashboardSummaryAction();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(sampleDTO);
    });
  });

  describe('getAdminSalesAnalyticsAction', () => {
    it('일반 고객 역할일 경우 인가 에러를 반환한다', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: {
          user: {
            id: 'cust-1',
            user_metadata: { role: 'customer' },
          },
        },
      });

      const result = await getAdminSalesAnalyticsAction('7d');

      expect(result.success).toBe(false);
      expect(result.error).toContain('권한이 없습니다');
    });

    it('관리자 권한인 경우 매출 분석 DTO를 정상 반환한다', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: {
          user: {
            id: 'admin-1',
            user_metadata: { role: 'admin' },
          },
        },
      });

      const sampleAnalytics = {
        period: '7d' as const,
        dailyTrend: [],
        totalPeriodSales: 1500000,
        averageDailySales: 214286,
        maxDailySales: 400000,
        statusPipeline: [],
        totalOrdersInPipeline: 30,
        generatedAt: new Date().toISOString(),
      };

      mockAnalyticsExecute.mockResolvedValueOnce(ok(sampleAnalytics));

      const result = await getAdminSalesAnalyticsAction('7d');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(sampleAnalytics);
    });
  });
});
