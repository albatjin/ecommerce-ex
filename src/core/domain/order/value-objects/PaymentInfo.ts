import { ValueObject } from '../../shared/ValueObject';
import { Result, ok } from '../../shared/Result';
import { DomainError } from '../../shared/AppError';
import type { PaymentMethod, PaymentStatus } from '@/shared/types/database.types';

export interface PaymentInfoProps {
  method: PaymentMethod;
  status: PaymentStatus;
  details?: Record<string, unknown> | null;
  paidAt?: Date | null;
}

/**
 * 주문 결제 정보 Value Object (불변 객체)
 */
export class PaymentInfo extends ValueObject<PaymentInfoProps> {
  private constructor(props: PaymentInfoProps) {
    super(props);
  }

  get method(): PaymentMethod { return this.props.method; }
  get status(): PaymentStatus { return this.props.status; }
  get details(): Record<string, unknown> | null | undefined { return this.props.details; }
  get paidAt(): Date | null | undefined { return this.props.paidAt; }

  public isCompleted(): boolean {
    return this.props.status === 'COMPLETED';
  }

  public markAsCompleted(paidAt: Date = new Date(), details?: Record<string, unknown>): PaymentInfo {
    return new PaymentInfo({
      ...this.props,
      status: 'COMPLETED',
      paidAt,
      details: details || this.props.details,
    });
  }

  public markAsFailed(details?: Record<string, unknown>): PaymentInfo {
    return new PaymentInfo({
      ...this.props,
      status: 'FAILED',
      details: details || this.props.details,
    });
  }

  public markAsRefunded(details?: Record<string, unknown>): PaymentInfo {
    return new PaymentInfo({
      ...this.props,
      status: 'REFUNDED',
      details: details || this.props.details,
    });
  }

  public static create(props: PaymentInfoProps): Result<PaymentInfo, DomainError> {
    return ok(
      new PaymentInfo({
        method: props.method,
        status: props.status,
        details: props.details ?? null,
        paidAt: props.paidAt ?? null,
      })
    );
  }

  public static createPending(method: PaymentMethod): PaymentInfo {
    return new PaymentInfo({
      method,
      status: 'PENDING',
      details: null,
      paidAt: null,
    });
  }
}

