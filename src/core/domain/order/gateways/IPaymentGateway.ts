import type { Result } from '@/core/domain/shared/Result';
import type { DomainError } from '@/core/domain/shared/AppError';
import type { PaymentMethod } from '@/shared/types/database.types';

export interface PaymentRequestParams {
  orderId: string;
  orderNumber: string;
  amount: number;
  paymentMethod: PaymentMethod;
  customerName: string;
  customerEmail?: string;
  paymentDetails?: Record<string, unknown>;
}

export interface PaymentApprovalResult {
  transactionId: string;
  approvedAt: Date;
  amount: number;
  paymentMethod: PaymentMethod;
  rawDetails: Record<string, unknown>;
}

/**
 * 결제 게이트웨이(PG) 어댑터 인터페이스 (Clean Architecture Port)
 */
export interface IPaymentGateway {
  requestPayment(
    params: PaymentRequestParams
  ): Promise<Result<PaymentApprovalResult, DomainError>>;
}

