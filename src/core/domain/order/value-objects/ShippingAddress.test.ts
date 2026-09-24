import { describe, it, expect } from 'vitest';
import { ShippingAddress } from './ShippingAddress';

describe('ShippingAddress Value Object', () => {
  it('유효한 배송지 정보를 정상 생성한다', () => {
    const result = ShippingAddress.create({
      recipientName: '홍길동',
      recipientPhone: '010-1234-5678',
      address: '서울특별시 강남구 테헤란로 123 4층',
      zipcode: '06234',
      message: '문 앞에 놓아주세요',
    });

    expect(result.isSuccess).toBe(true);
    const addr = result.getValue();
    expect(addr.recipientName).toBe('홍길동');
    expect(addr.recipientPhone).toBe('010-1234-5678');
    expect(addr.zipcode).toBe('06234');
    expect(addr.message).toBe('문 앞에 놓아주세요');
  });

  it('필수 입력 항목 누락 시 실패한다', () => {
    // 이름 누락
    const noName = ShippingAddress.create({
      recipientName: '',
      recipientPhone: '010-1234-5678',
      address: '서울시',
      zipcode: '12345',
    });
    expect(noName.isFailure).toBe(true);
    expect(noName.getError().message).toContain('이름');

    // 전화번호 형식 오류
    const invalidPhone = ShippingAddress.create({
      recipientName: '홍길동',
      recipientPhone: '123',
      address: '서울시',
      zipcode: '12345',
    });
    expect(invalidPhone.isFailure).toBe(true);
    expect(invalidPhone.getError().message).toContain('전화번호');
  });

  it('동일한 속성을 가진 두 배송지 객체는 동등하다', () => {
    const addr1 = ShippingAddress.create({
      recipientName: '홍길동',
      recipientPhone: '010-1234-5678',
      address: '서울시 강남구',
      zipcode: '12345',
    }).getValue();

    const addr2 = ShippingAddress.create({
      recipientName: '홍길동',
      recipientPhone: '010-1234-5678',
      address: '서울시 강남구',
      zipcode: '12345',
    }).getValue();

    expect(addr1.equals(addr2)).toBe(true);
  });
});

