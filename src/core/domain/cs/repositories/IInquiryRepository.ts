import type { Inquiry, InquiryStatus, InquiryCategory } from '../entities/Inquiry';

export interface FindInquiriesFilter {
  customerId?: string;
  status?: InquiryStatus;
  category?: InquiryCategory;
  limit?: number;
  offset?: number;
}

export interface IInquiryRepository {
  findById(id: string): Promise<Inquiry | null>;
  findByCustomerId(customerId: string): Promise<Inquiry[]>;
  findMany(filter?: FindInquiriesFilter): Promise<{ inquiries: Inquiry[]; totalCount: number }>;
  save(inquiry: Inquiry): Promise<void>;
}
