'use server';

import { revalidatePath } from 'next/cache';
import { getServerClient } from '@/core/infrastructure/supabase/server';
import { SupabaseInquiryRepository } from '@/core/infrastructure/repositories/SupabaseInquiryRepository';
import {
  CreateInquiryUseCase,
  type CreateInquiryInput,
  type InquiryDTO,
} from '@/core/application/cs/use-cases/CreateInquiryUseCase';
import { GetCustomerInquiriesUseCase } from '@/core/application/cs/use-cases/GetCustomerInquiriesUseCase';
import {
  AnswerInquiryUseCase,
  type AnswerInquiryInput,
} from '@/core/application/cs/use-cases/AnswerInquiryUseCase';
import {
  GetAdminInquiriesUseCase,
  type GetAdminInquiriesInput,
} from '@/core/application/cs/use-cases/GetAdminInquiriesUseCase';

export interface InquiryActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * 1:1 고객 문의 등록 Action
 */
export async function createInquiryAction(
  input: Omit<CreateInquiryInput, 'customerId' | 'customerName' | 'customerEmail'>
): Promise<InquiryActionResult<InquiryDTO>> {
  try {
    const supabase = await getServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: '로그인이 필요한 서비스입니다.',
      };
    }

    const customerName =
      (user.user_metadata?.name as string) ||
      user.email?.split('@')[0] ||
      '고객';

    const repo = new SupabaseInquiryRepository(supabase);
    const useCase = new CreateInquiryUseCase(repo);

    const result = await useCase.execute({
      ...input,
      customerId: user.id,
      customerName,
      customerEmail: user.email,
    });

    if (result.isFailure) {
      return {
        success: false,
        error: result.getError().message,
      };
    }

    revalidatePath('/my-page/inquiries');
    revalidatePath('/admin/inquiries');

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
          : '문의 등록 중 오류가 발생했습니다.',
    };
  }
}

/**
 * 로그인 회원의 1:1 문의 내역 조회 Action
 */
export async function getCustomerInquiriesAction(): Promise<
  InquiryActionResult<InquiryDTO[]>
> {
  try {
    const supabase = await getServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: '로그인이 필요한 서비스입니다.',
      };
    }

    const repo = new SupabaseInquiryRepository(supabase);
    const useCase = new GetCustomerInquiriesUseCase(repo);

    const result = await useCase.execute(user.id);
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
          : '문의 목록을 불러오는 중 오류가 발생했습니다.',
    };
  }
}

/**
 * 관리자 문의 답변 등록 Action
 */
export async function answerInquiryAction(
  input: AnswerInquiryInput
): Promise<InquiryActionResult<InquiryDTO>> {
  try {
    const supabase = await getServerClient();
    const repo = new SupabaseInquiryRepository(supabase);
    const useCase = new AnswerInquiryUseCase(repo);

    const result = await useCase.execute(input);
    if (result.isFailure) {
      return {
        success: false,
        error: result.getError().message,
      };
    }

    revalidatePath('/my-page/inquiries');
    revalidatePath('/admin/inquiries');

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
          : '답변 등록 중 오류가 발생했습니다.',
    };
  }
}

/**
 * 관리자 전체 문의 목록 조회 Action
 */
export async function getAdminInquiriesAction(
  input: GetAdminInquiriesInput = {}
): Promise<InquiryActionResult<{ inquiries: InquiryDTO[]; totalCount: number }>> {
  try {
    const supabase = await getServerClient();
    const repo = new SupabaseInquiryRepository(supabase);
    const useCase = new GetAdminInquiriesUseCase(repo);

    const result = await useCase.execute(input);
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
          : '관리자 문의 목록을 불러오는 중 오류가 발생했습니다.',
    };
  }
}
