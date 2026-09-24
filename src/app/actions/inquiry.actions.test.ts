import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createInquiryAction,
  getCustomerInquiriesAction,
  answerInquiryAction,
  getAdminInquiriesAction,
} from './inquiry.actions';
import { ok, fail } from '@/core/domain/shared/Result';
import { DomainError } from '@/core/domain/shared/AppError';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

const mockGetUser = vi.fn().mockResolvedValue({
  data: {
    user: {
      id: 'user-123',
      email: 'test@example.com',
      user_metadata: { name: '홍길동' },
    },
  },
});

vi.mock('@/core/infrastructure/supabase/server', () => ({
  getServerClient: vi.fn().mockImplementation(() => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

const mockCreateExecute = vi.fn();
vi.mock('@/core/application/cs/use-cases/CreateInquiryUseCase', () => ({
  CreateInquiryUseCase: class {
    execute = mockCreateExecute;
  },
}));

const mockGetCustomerExecute = vi.fn();
vi.mock('@/core/application/cs/use-cases/GetCustomerInquiriesUseCase', () => ({
  GetCustomerInquiriesUseCase: class {
    execute = mockGetCustomerExecute;
  },
}));

const mockAnswerExecute = vi.fn();
vi.mock('@/core/application/cs/use-cases/AnswerInquiryUseCase', () => ({
  AnswerInquiryUseCase: class {
    execute = mockAnswerExecute;
  },
}));

const mockGetAdminExecute = vi.fn();
vi.mock('@/core/application/cs/use-cases/GetAdminInquiriesUseCase', () => ({
  GetAdminInquiriesUseCase: class {
    execute = mockGetAdminExecute;
  },
}));

describe('inquiry.actions (Stage 31)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createInquiryAction', () => {
    it('로그인한 사용자가 문의 등록 시 성공한다', async () => {
      mockCreateExecute.mockResolvedValue(
        ok({
          id: 'inq-1',
          title: '배송 문의',
          status: 'PENDING',
        })
      );

      const result = await createInquiryAction({
        category: 'SHIPPING',
        title: '배송 문의',
        content: '언제 도착하나요?',
      });

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('inq-1');
    });

    it('비로그인 사용자가 문의 등록 시 실패한다', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } });

      const result = await createInquiryAction({
        category: 'SHIPPING',
        title: '배송 문의',
        content: '언제 도착하나요?',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('로그인');
    });
  });

  describe('getCustomerInquiriesAction', () => {
    it('로그인한 사용자의 문의 목록을 조회한다', async () => {
      mockGetCustomerExecute.mockResolvedValue(
        ok([
          {
            id: 'inq-1',
            title: '배송 문의',
            status: 'PENDING',
          },
        ])
      );

      const result = await getCustomerInquiriesAction();
      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(1);
    });
  });

  describe('answerInquiryAction', () => {
    it('관리자가 답변을 등록하면 성공한다', async () => {
      mockAnswerExecute.mockResolvedValue(
        ok({
          id: 'inq-1',
          status: 'ANSWERED',
          answer: '처리 완료되었습니다.',
        })
      );

      const result = await answerInquiryAction({
        inquiryId: 'inq-1',
        answerText: '처리 완료되었습니다.',
      });

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('ANSWERED');
    });
  });

  describe('getAdminInquiriesAction', () => {
    it('관리자 문의 목록을 조회한다', async () => {
      mockGetAdminExecute.mockResolvedValue(
        ok({
          inquiries: [{ id: 'inq-1', title: '문의' }],
          totalCount: 1,
        })
      );

      const result = await getAdminInquiriesAction();
      expect(result.success).toBe(true);
      expect(result.data?.totalCount).toBe(1);
    });
  });
});
