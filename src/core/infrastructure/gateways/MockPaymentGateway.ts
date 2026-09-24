import { Result, ok, fail } from '@/core/domain/shared/Result';
import { DomainError } from '@/core/domain/shared/AppError';
import type {
  IPaymentGateway,
  PaymentRequestParams,
  PaymentApprovalResult,
  PaymentRefundParams,
  PaymentRefundResult,
} from '@/core/domain/order/gateways/IPaymentGateway';

export interface MockPaymentGatewayOptions {
  shouldFail?: boolean;
  failureReason?: string;
}

/**
 * 모의 가상 결제 게이트웨이 어댑터 (PG Mock Adapter)
 * 신용카드, 카카오페이, 네이버페이, 토스페이, 휴대폰 결제 등의 승인 프로세스를 시뮬레이션합니다.
 */
export class MockPaymentGateway implements IPaymentGateway {
  private shouldFail: boolean;
  private failureReason?: string;

  constructor(options?: MockPaymentGatewayOptions) {
    this.shouldFail = options?.shouldFail ?? false;
    this.failureReason = options?.failureReason;
  }

  public setShouldFail(shouldFail: boolean, failureReason?: string): void {
    this.shouldFail = shouldFail;
    this.failureReason = failureReason;
  }

  public async requestPayment(
    params: PaymentRequestParams
  ): Promise<Result<PaymentApprovalResult, DomainError>> {
    if (this.shouldFail) {
      return fail(
        new DomainError(
          this.failureReason ||
            '가상 PG 결제 승인이 거절되었습니다. (한도 초과 또는 카드사 시스템 점검)'
        )
      );
    }

    if (params.amount < 0) {
      return fail(new DomainError('결제 금액은 0원 이상이어야 합니다.'));
    }

    const prefix = params.paymentMethod.replace(/_/g, '').slice(0, 4).toUpperCase();
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const transactionId = `PG_${prefix}_${Date.now()}_${randomHex}`;

    const cardIssuerMap: Record<string, string> = {
      CREDIT_CARD: '현대/KB국민카드',
      NAVER_PAY: '네이버페이 포인트/머니',
      KAKAO_PAY: '카카오페이머니',
      TOSS_PAY: '토스머니',
      VIRTUAL_ACCOUNT: '가상계좌 (KB국민은행)',
      MOBILE: 'SKT 소액결제',
      PAYPAL: 'PayPal Express Checkout (글로벌 간편결제)',
    };

    return ok({
      transactionId,
      approvedAt: new Date(),
      amount: params.amount,
      paymentMethod: params.paymentMethod,
      rawDetails: {
        gateway: 'MockPaymentGateway',
        authCode: `AUTH_${randomHex}`,
        method: params.paymentMethod,
        issuer: cardIssuerMap[params.paymentMethod] || '전자금융공동망',
        customerName: params.customerName,
        customerEmail: params.customerEmail || null,
        ...params.paymentDetails,
      },
    });
  }

  public async refundPayment(
    params: PaymentRefundParams
  ): Promise<Result<PaymentRefundResult, DomainError>> {
    if (this.shouldFail) {
      return fail(
        new DomainError(
          this.failureReason || '가상 PG 결제 취소/환불 처리가 거절되었습니다.'
        )
      );
    }

    if (params.amount < 0) {
      return fail(new DomainError('환불 금액은 0원 이상이어야 합니다.'));
    }

    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const refundId = `REF_${Date.now()}_${randomHex}`;

    return ok({
      refundId,
      refundedAt: new Date(),
      amount: params.amount,
      rawDetails: {
        gateway: 'MockPaymentGateway',
        transactionId: params.transactionId || null,
        orderId: params.orderId,
        orderNumber: params.orderNumber,
        reason: params.reason || '고객 주문 취소 요청',
      },
    });
  }
}

