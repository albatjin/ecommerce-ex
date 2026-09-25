'use server';

import { getServerClient } from '@/core/infrastructure/supabase/server';
import { SupabaseOrderRepository } from '@/core/infrastructure/repositories/SupabaseOrderRepository';
import { SupabaseInquiryRepository } from '@/core/infrastructure/repositories/SupabaseInquiryRepository';
import {
  GetAdminDashboardSummaryUseCase,
  type AdminDashboardDTO,
} from '@/core/application/admin';

export interface AdminActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * 관리자 대시보드 4대 핵심 KPI 및 최근 운영 지표 조회 Server Action
 */
export async function getAdminDashboardSummaryAction(): Promise<
  AdminActionResult<AdminDashboardDTO>
> {
  try {
    const supabase = await getServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 관리자 인가 확인 (권한 메타데이터 검사)
    const userRole = user?.user_metadata?.role || user?.app_metadata?.role || 'admin';
    const allowedRoles = ['super_admin', 'admin', 'manager', 'staff'];
    const isAdmin = allowedRoles.includes(userRole);

    if (user && !isAdmin) {
      return {
        success: false,
        error: '관리자 전용 기능에 접근할 수 있는 권한이 없습니다.',
      };
    }

    const orderRepo = new SupabaseOrderRepository(supabase);
    const inquiryRepo = new SupabaseInquiryRepository(supabase);
    const useCase = new GetAdminDashboardSummaryUseCase(orderRepo, inquiryRepo);

    const result = await useCase.execute();

    if (result.isFailure) {
      return {
        success: false,
        error: result.getError().message,
      };
    }

    return {
      success: true,
      data: result.getValue(),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : '대시보드 통계를 조회하는 중 오류가 발생했습니다.',
    };
  }
}
