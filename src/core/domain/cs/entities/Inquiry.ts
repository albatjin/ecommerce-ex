import { Entity } from '@/core/domain/shared/Entity';
import { Result, ok, fail } from '@/core/domain/shared/Result';
import { DomainError } from '@/core/domain/shared/AppError';

export type InquiryCategory =
  | 'ORDER'
  | 'PRODUCT'
  | 'RETURN_REFUND'
  | 'SHIPPING'
  | 'OTHER';

export type InquiryStatus = 'PENDING' | 'ANSWERED';

export const INQUIRY_CATEGORY_LABELS: Record<InquiryCategory, string> = {
  ORDER: '주문/결제',
  PRODUCT: '상품 문의',
  RETURN_REFUND: '취소/반품/환불',
  SHIPPING: '배송 문의',
  OTHER: '기타 문의',
};

export const INQUIRY_STATUS_LABELS: Record<InquiryStatus, string> = {
  PENDING: '답변 대기',
  ANSWERED: '답변 완료',
};

export interface InquiryProps {
  customerId: string;
  customerName: string;
  customerEmail?: string;
  orderId?: string | null;
  category: InquiryCategory;
  title: string;
  content: string;
  status: InquiryStatus;
  answer?: string | null;
  answeredAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Inquiry extends Entity<InquiryProps> {
  private constructor(props: InquiryProps, id?: string) {
    super(props, id);
  }

  get customerId(): string {
    return this.props.customerId;
  }
  get customerName(): string {
    return this.props.customerName;
  }
  get customerEmail(): string | undefined {
    return this.props.customerEmail;
  }
  get orderId(): string | null | undefined {
    return this.props.orderId;
  }
  get category(): InquiryCategory {
    return this.props.category;
  }
  get categoryLabel(): string {
    return INQUIRY_CATEGORY_LABELS[this.props.category] || this.props.category;
  }
  get title(): string {
    return this.props.title;
  }
  get content(): string {
    return this.props.content;
  }
  get status(): InquiryStatus {
    return this.props.status;
  }
  get statusLabel(): string {
    return INQUIRY_STATUS_LABELS[this.props.status] || this.props.status;
  }
  get answer(): string | null | undefined {
    return this.props.answer;
  }
  get answeredAt(): Date | null | undefined {
    return this.props.answeredAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * 관리자 답변 등록
   */
  public answerInquiry(answerText: string, answeredAt: Date = new Date()): Result<void, DomainError> {
    if (!answerText || !answerText.trim()) {
      return fail(new DomainError('답변 내용은 필수 입력 사항입니다.'));
    }

    this.props.answer = answerText.trim();
    this.props.status = 'ANSWERED';
    this.props.answeredAt = answeredAt;
    this.props.updatedAt = new Date();

    return ok();
  }

  public static create(
    props: Omit<InquiryProps, 'createdAt' | 'updatedAt' | 'status' | 'answer' | 'answeredAt'> & {
      status?: InquiryStatus;
      answer?: string | null;
      answeredAt?: Date | null;
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: string
  ): Result<Inquiry, DomainError> {
    if (!props.customerId || !props.customerId.trim()) {
      return fail(new DomainError('고객 식별자는 필수입니다.'));
    }
    if (!props.title || props.title.trim().length < 2) {
      return fail(new DomainError('문의 제목은 2자 이상 입력해야 합니다.'));
    }
    if (!props.content || props.content.trim().length < 5) {
      return fail(new DomainError('문의 내용은 5자 이상 상세히 입력해야 합니다.'));
    }

    const now = new Date();
    const inquiry = new Inquiry(
      {
        ...props,
        title: props.title.trim(),
        content: props.content.trim(),
        status: props.status ?? 'PENDING',
        answer: props.answer ?? null,
        answeredAt: props.answeredAt ?? null,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id
    );

    return ok(inquiry);
  }
}
