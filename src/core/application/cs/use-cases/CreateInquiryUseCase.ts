import { Result, ok, fail } from '@/core/domain/shared/Result';
import { DomainError } from '@/core/domain/shared/AppError';
import {
  Inquiry,
  type InquiryCategory,
  type InquiryStatus,
} from '@/core/domain/cs/entities/Inquiry';
import type { IInquiryRepository } from '@/core/domain/cs/repositories/IInquiryRepository';

export interface CreateInquiryInput {
  customerId: string;
  customerName: string;
  customerEmail?: string;
  orderId?: string | null;
  category: InquiryCategory;
  title: string;
  content: string;
}

export interface InquiryDTO {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  orderId?: string | null;
  category: InquiryCategory;
  categoryLabel: string;
  title: string;
  content: string;
  status: InquiryStatus;
  statusLabel: string;
  answer?: string | null;
  answeredAt?: string | null;
  createdAt: string;
}

export class CreateInquiryUseCase {
  constructor(private readonly inquiryRepo: IInquiryRepository) {}

  public async execute(input: CreateInquiryInput): Promise<Result<InquiryDTO, DomainError>> {
    const inquiryResult = Inquiry.create({
      customerId: input.customerId,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      orderId: input.orderId,
      category: input.category,
      title: input.title,
      content: input.content,
    });

    if (inquiryResult.isFailure) {
      return fail(inquiryResult.getError());
    }

    const inquiry = inquiryResult.getValue();
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
