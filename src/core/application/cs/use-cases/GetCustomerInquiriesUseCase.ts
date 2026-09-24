import { Result, ok, fail } from '@/core/domain/shared/Result';
import { DomainError } from '@/core/domain/shared/AppError';
import type { IInquiryRepository } from '@/core/domain/cs/repositories/IInquiryRepository';
import type { InquiryDTO } from './CreateInquiryUseCase';

export class GetCustomerInquiriesUseCase {
  constructor(private readonly inquiryRepo: IInquiryRepository) {}

  public async execute(customerId: string): Promise<Result<InquiryDTO[], DomainError>> {
    if (!customerId || !customerId.trim()) {
      return fail(new DomainError('고객 식별자가 필요합니다.'));
    }

    const inquiries = await this.inquiryRepo.findByCustomerId(customerId);

    const dtoList: InquiryDTO[] = inquiries.map((inquiry) => ({
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
    }));

    return ok(dtoList);
  }
}
