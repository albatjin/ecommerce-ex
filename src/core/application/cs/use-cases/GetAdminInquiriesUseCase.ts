import { Result, ok } from '@/core/domain/shared/Result';
import { DomainError } from '@/core/domain/shared/AppError';
import type { IInquiryRepository } from '@/core/domain/cs/repositories/IInquiryRepository';
import type { InquiryCategory, InquiryStatus } from '@/core/domain/cs/entities/Inquiry';
import type { InquiryDTO } from './CreateInquiryUseCase';

export interface GetAdminInquiriesInput {
  status?: InquiryStatus;
  category?: InquiryCategory;
  limit?: number;
  offset?: number;
}

export class GetAdminInquiriesUseCase {
  constructor(private readonly inquiryRepo: IInquiryRepository) {}

  public async execute(
    input: GetAdminInquiriesInput = {}
  ): Promise<Result<{ inquiries: InquiryDTO[]; totalCount: number }, DomainError>> {
    const { inquiries, totalCount } = await this.inquiryRepo.findMany(input);

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

    return ok({
      inquiries: dtoList,
      totalCount,
    });
  }
}
