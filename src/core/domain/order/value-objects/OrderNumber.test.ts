import { describe, it, expect } from 'vitest';
import { OrderNumber } from './OrderNumber';

describe('OrderNumber Value Object', () => {
  it('유효한 주문 번호를 정상 생성한다', () => {
    const result = OrderNumber.create('ORD-20260924-A1B2C');
    expect(result.isSuccess).toBe(true);
    expect(result.getValue().value).toBe('ORD-20260924-A1B2C');
  });

  it('빈 문자열이거나 너무 짧으면 생성이 실패한다', () => {
    const emptyResult = OrderNumber.create('');
    expect(emptyResult.isFailure).toBe(true);

    const shortResult = OrderNumber.create('123');
    expect(shortResult.isFailure).toBe(true);
  });

  it('generate()는 일관된 ORD- 형식의 유효한 주문 번호를 생성한다', () => {
    const orderNumber = OrderNumber.generate();
    expect(orderNumber.value).toMatch(/^ORD-\d{8}-[A-Z0-9]{5}$/);
  });
});

