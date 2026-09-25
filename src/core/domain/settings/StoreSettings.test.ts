import { describe, it, expect } from 'vitest';
import { StoreSettings } from './StoreSettings';

describe('StoreSettings Domain Entity', () => {
  it('기본 설정값으로 생성할 수 있다', () => {
    const settings = StoreSettings.createDefault();
    expect(settings.storeName).toBe('CommerceHub 공식스토어');
    expect(settings.defaultShippingFee).toBe(3000);
    expect(settings.freeShippingThreshold).toBe(50000);
    expect(settings.isOperating).toBe(true);
    expect(settings.purchaseRewardRate).toBe(1.5);
  });

  it('유효하지 않은 상호명이나 대표자명은 에러를 반환한다', () => {
    const defaultSettings = StoreSettings.createDefault();
    const result = StoreSettings.create({
      ...defaultSettings.getProps(),
      storeName: '',
    });
    expect(result.isFailure).toBe(true);
    expect(result.getError().message).toContain('스토어 상호명');
  });

  it('음수 배송비나 잘못된 적립률은 생성을 거부한다', () => {
    const defaultSettings = StoreSettings.createDefault();
    const result1 = StoreSettings.create({
      ...defaultSettings.getProps(),
      defaultShippingFee: -100,
    });
    expect(result1.isFailure).toBe(true);

    const result2 = StoreSettings.create({
      ...defaultSettings.getProps(),
      purchaseRewardRate: 150,
    });
    expect(result2.isFailure).toBe(true);
  });

  it('사업자 정보, 배송 정책, 적립금 정책, 운영 정책을 업데이트할 수 있다', () => {
    const settings = StoreSettings.createDefault();

    const bizResult = settings.updateBusinessInfo({
      storeName: '뉴 커머스허브',
      representativeName: '홍길동',
      businessNumber: '111-22-33333',
      ecommercePermitNumber: '2025-서울강남-0001호',
      csPhone: '02-1234-5678',
      csEmail: 'cs@newcommercehub.com',
      address: '서울시 서초구 서초대로 1',
      zipcode: '06500',
    });
    expect(bizResult.isSuccess).toBe(true);
    expect(settings.storeName).toBe('뉴 커머스허브');
    expect(settings.representativeName).toBe('홍길동');

    const shipResult = settings.updateShippingPolicy({
      defaultShippingFee: 3500,
      freeShippingThreshold: 70000,
      islandMountainShippingFee: 5000,
    });
    expect(shipResult.isSuccess).toBe(true);
    expect(settings.defaultShippingFee).toBe(3500);
    expect(settings.freeShippingThreshold).toBe(70000);

    const rewardResult = settings.updateRewardPolicy({
      purchaseRewardRate: 2.0,
      textReviewReward: 1000,
      photoReviewReward: 2000,
      welcomeReward: 5000,
    });
    expect(rewardResult.isSuccess).toBe(true);
    expect(settings.purchaseRewardRate).toBe(2.0);
    expect(settings.welcomeReward).toBe(5000);

    settings.updateOperatingPolicy({
      isOperating: false,
      requireAdultVerification: true,
      allowGuestOrder: false,
    });
    expect(settings.isOperating).toBe(false);
    expect(settings.requireAdultVerification).toBe(true);
    expect(settings.allowGuestOrder).toBe(false);
  });
});
