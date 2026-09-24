import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateInquiryUseCase } from './CreateInquiryUseCase';
import { GetCustomerInquiriesUseCase } from './GetCustomerInquiriesUseCase';
import { AnswerInquiryUseCase } from './AnswerInquiryUseCase';
import { GetAdminInquiriesUseCase } from './GetAdminInquiriesUseCase';
import { Inquiry } from '@/core/domain/cs/entities/Inquiry';
import type { IInquiryRepository } from '@/core/domain/cs/repositories/IInquiryRepository';

describe('Inquiry UseCases (Stage 31)', () => {
  let mockInquiryRepo: IInquiryRepository;

  const createSampleInquiry = (status: 'PENDING' | 'ANSWERED' = 'PENDING') => {
    return Inquiry.create(
      {
        customerId: 'user-1',
        customerName: '홍길동',
        customerEmail: 'hong@example.com',
        orderId: 'order-1',
        category: 'ORDER',
        title: '배송지 변경 요청합니다',
        content: '주문한 상품의 배송지를 변경하고 싶습니다. 가능한가요?',
        status,
        answer: status === 'ANSWERED' ? '배송 출발 전이므로 변경 처리 완료되었습니다.' : null,
        answeredAt: status === 'ANSWERED' ? new Date() : null,
      },
      'inq-1'
    ).getValue();
  };

  beforeEach(() => {
    mockInquiryRepo = {
      findById: vi.fn(),
      findByCustomerId: vi.fn(),
      findMany: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    };
  });

  describe('CreateInquiryUseCase', () => {
    it('유효한 문의 내용을 제출하면 문의가 PENDING 상태로 등록된다', async () => {
      const useCase = new CreateInquiryUseCase(mockInquiryRepo);

      const result = await useCase.execute({
        customerId: 'user-1',
        customerName: '홍길동',
        customerEmail: 'hong@example.com',
        category: 'SHIPPING',
        title: '배송 언제 오나요?',
        content: '어제 주문했는데 오늘 출고 가능한지 문의드립니다.',
      });

      expect(result.isSuccess).toBe(true);
      const output = result.getValue();
      expect(output.title).toBe('배송 언제 오나요?');
      expect(output.status).toBe('PENDING');
      expect(output.categoryLabel).toBe('배송 문의');
      expect(mockInquiryRepo.save).toHaveBeenCalledTimes(1);
    });

    it('문의 내용이 5자 미만이면 유효성 오류로 실패한다', async () => {
      const useCase = new CreateInquiryUseCase(mockInquiryRepo);

      const result = await useCase.execute({
        customerId: 'user-1',
        customerName: '홍길동',
        category: 'OTHER',
        title: '문의합니다',
        content: '문의',
      });

      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('5자 이상');
      expect(mockInquiryRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('GetCustomerInquiriesUseCase', () => {
    it('고객 식별자로 등록된 문의 내역 목록을 조회한다', async () => {
      const inquiry = createSampleInquiry('PENDING');
      vi.mocked(mockInquiryRepo.findByCustomerId).mockResolvedValue([inquiry]);

      const useCase = new GetCustomerInquiriesUseCase(mockInquiryRepo);
      const result = await useCase.execute('user-1');

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().length).toBe(1);
      expect(result.getValue()[0].title).toBe('배송지 변경 요청합니다');
    });
  });

  describe('AnswerInquiryUseCase', () => {
    it('관리자가 답변을 등록하면 문의가 ANSWERED 상태로 전이된다', async () => {
      const inquiry = createSampleInquiry('PENDING');
      vi.mocked(mockInquiryRepo.findById).mockResolvedValue(inquiry);

      const useCase = new AnswerInquiryUseCase(mockInquiryRepo);
      const result = await useCase.execute({
        inquiryId: 'inq-1',
        answerText: '고객님 요청하신 배송지로 변경되었습니다.',
      });

      expect(result.isSuccess).toBe(true);
      const output = result.getValue();
      expect(output.status).toBe('ANSWERED');
      expect(output.answer).toBe('고객님 요청하신 배송지로 변경되었습니다.');
      expect(output.statusLabel).toBe('답변 완료');
      expect(mockInquiryRepo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('GetAdminInquiriesUseCase', () => {
    it('전체 문의 목록을 조회한다', async () => {
      const inquiry = createSampleInquiry('PENDING');
      vi.mocked(mockInquiryRepo.findMany).mockResolvedValue({
        inquiries: [inquiry],
        totalCount: 1,
      });

      const useCase = new GetAdminInquiriesUseCase(mockInquiryRepo);
      const result = await useCase.execute({ status: 'PENDING' });

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().totalCount).toBe(1);
      expect(result.getValue().inquiries[0].status).toBe('PENDING');
    });
  });
});

