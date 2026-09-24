import { describe, it, expect } from 'vitest';
import { MockPaymentGateway } from './MockPaymentGateway';

describe('MockPaymentGateway', () => {
  const defaultParams = {
    orderId: 'order-1',
    orderNumber: 'ORD-20260924-00001',
    amount: 50000,
    paymentMethod: 'CREDIT_CARD' as const,
    customerName: '홍길동',
  };

  it('기본 결제 승인 요청 시 고유 거래 ID 및 승인 일시를 포함한 성공 응답을 반환한다', async () => {
    const gateway = new MockPaymentGateway();
    const result = await gateway.requestPayment(defaultParams);

    expect(result.isSuccess).toBe(true);
    const data = result.getValue();
    expect(data.transactionId).toMatch(/^PG_CRED_\d+_[A-Z0-9]+$/);
    expect(data.amount).toBe(50000);
    expect(data.paymentMethod).toBe('CREDIT_CARD');
    expect(data.rawDetails.gateway).toBe('MockPaymentGateway');
    expect(data.rawDetails.issuer).toBe('현대/KB국민카드');
  });

  it('음수 결제 금액 요청 시 실패를 반환한다', async () => {
    const gateway = new MockPaymentGateway();
    const result = await gateway.requestPayment({
      ...defaultParams,
      amount: -100,
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError().message).toContain('0원 이상');
  });

  it('shouldFail 옵션이 활성화되어 있으면 거절 에러를 반환한다', async () => {
    const gateway = new MockPaymentGateway({
      shouldFail: true,
      failureReason: '한도 초과로 인한 결제 승인 실패',
    });
    const result = await gateway.requestPayment(defaultParams);

    expect(result.isFailure).toBe(true);
    expect(result.getError().message).toContain('한도 초과');
  });

  it('네이버페이 및 카카오페이 등 간편결제 수단도 올바른 issuer 정보로 승인된다', async () => {
    const gateway = new MockPaymentGateway();
    const result = await gateway.requestPayment({
      ...defaultParams,
      paymentMethod: 'NAVER_PAY',
    });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().rawDetails.issuer).toBe('네이버페이 포인트/머니');
  });

  it('PAYPAL 글로벌 결제 수단도 올바른 issuer 정보로 승인된다', async () => {
    const gateway = new MockPaymentGateway();
    const result = await gateway.requestPayment({
      ...defaultParams,
      paymentMethod: 'PAYPAL',
    });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().rawDetails.issuer).toContain('PayPal Express Checkout');
  });
});

