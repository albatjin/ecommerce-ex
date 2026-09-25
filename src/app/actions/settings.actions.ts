'use server';

import { revalidatePath } from 'next/cache';
import { getServerClient } from '@/core/infrastructure/supabase/server';
import { SupabaseStoreSettingsRepository } from '@/core/infrastructure/repositories/SupabaseStoreSettingsRepository';
import {
  GetStoreSettingsUseCase,
  UpdateStoreSettingsUseCase,
  type StoreSettingsDTO,
  type UpdateStoreSettingsDTO,
} from '@/core/application/settings';
import { checkIsAdmin } from '@/shared/utils/admin';

export interface SettingsActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * 쇼핑몰 환경설정 조회 Server Action
 */
export async function getStoreSettingsAction(): Promise<
  SettingsActionResult<StoreSettingsDTO>
> {
  try {
    const supabase = await getServerClient();
    const settingsRepo = new SupabaseStoreSettingsRepository(supabase);
    const useCase = new GetStoreSettingsUseCase(settingsRepo);

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
          : '환경설정 정보를 불러오는데 실패했습니다.',
    };
  }
}

/**
 * 쇼핑몰 환경설정 수정/저장 Server Action (관리자 전용)
 */
export async function updateStoreSettingsAction(
  dto: UpdateStoreSettingsDTO
): Promise<SettingsActionResult<StoreSettingsDTO>> {
  try {
    const supabase = await getServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 관리자 인가 확인
    const userRole = user?.user_metadata?.role || user?.app_metadata?.role;
    const isAdmin = checkIsAdmin({ role: userRole, email: user?.email });

    if (user && !isAdmin) {
      return {
        success: false,
        error: '환경설정을 변경할 수 있는 관리자 권한이 없습니다.',
      };
    }

    const settingsRepo = new SupabaseStoreSettingsRepository(supabase);
    const useCase = new UpdateStoreSettingsUseCase(settingsRepo);

    const result = await useCase.execute(dto, user?.id);

    if (result.isFailure) {
      return {
        success: false,
        error: result.getError().message,
      };
    }

    revalidatePath('/admin/settings');
    revalidatePath('/', 'layout');

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
          : '환경설정을 저장하는 중 오류가 발생했습니다.',
    };
  }
}
