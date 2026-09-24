import { Result, ok, fail } from '@/core/domain/shared/Result';
import { DomainError } from '@/core/domain/shared/AppError';
import type { IInquiryRepository } from '@/core/domain/cs/repositories/IInquiryRepository';
import type { InquiryDTO } from './CreateInquiryUseCase';

export interface AnswerInquiryInput {
  inquiryId: string;
  answerText: string;
}

export class AnswerInquiryUseCase {
  constructor(private readonly inquiryRepo: IInquiryRepository) {}

  public async execute(input: AnswerInquiryInput): Promise<Result<InquiryDTO, DomainError>> {
    if (!input.answerText || !input.answerText.trim()) {
      return fail(new DomainError('답변 내용을 입력해 주세요.'));
    }

    const inquiry = await this.inquiryRepo.findById(input.inquiryId);
    if (!inquiry) {
      return fail(new DomainError(`해당 문의를 찾을 수 없습니다. (ID: ${input.inquiryId})`));
    }

    const answerResult = inquiry.answerInquiry(input.answerText);
    if (answerResult.isFailure) {
      return fail(answerResult.getError());
    }

    await this.inquiryRepo.save(inquiry);

    return ok({
      id: inquiry.id,
      customerId: inquiry.customerId,
      customerName: inquiry.customerName,
      customerEmail: inquiry.customerEmail,
      orderId: inquiry.orderId,
      category: inquiry.category,
      categoryLabel: inquiry.categoryLabel,
      title: inquiry.title,
      content: inquiry.content,
      status: inquiry.status,
      statusLabel: inquiry.statusLabel,
      answer: inquiry.answer,
      answeredAt: inquiry.answeredAt?.toISOString() ?? null,
      createdAt: inquiry.createdAt.toISOString(),
    });
  }
}
