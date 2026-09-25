import { Entity } from '../shared/Entity';
import { Result, ok, fail } from '../shared/Result';
import { ValidationError } from '../shared/AppError';

export interface StoreSettingsProps {
  storeName: string;
  representativeName: string;
  businessNumber: string;
  ecommercePermitNumber: string;
  csPhone: string;
  csEmail: string;
  address: string;
  zipcode: string;
  logoHeaderUrl?: string | null;
  logoMobileUrl?: string | null;
  faviconUrl?: string | null;
  isOperating: boolean;
  requireAdultVerification: boolean;
  allowGuestOrder: boolean;
  defaultShippingFee: number;
  freeShippingThreshold: number;
  islandMountainShippingFee: number;
  purchaseRewardRate: number;
  textReviewReward: number;
  photoReviewReward: number;
  welcomeReward: number;
  updatedAt: Date;
  updatedBy?: string | null;
}

export class StoreSettings extends Entity<StoreSettingsProps> {
  private constructor(props: StoreSettingsProps, id: string = 'default') {
    super(props, id);
  }

  public getProps(): StoreSettingsProps {
    return { ...this.props };
  }

  public static create(
    props: StoreSettingsProps,
    id: string = 'default'
  ): Result<StoreSettings, ValidationError> {
    if (!props.storeName || props.storeName.trim().length === 0) {
      return fail(new ValidationError('스토어 상호명을 입력해야 합니다.'));
    }
    if (!props.representativeName || props.representativeName.trim().length === 0) {
      return fail(new ValidationError('대표자명을 입력해야 합니다.'));
    }
    if (props.defaultShippingFee < 0) {
      return fail(new ValidationError('기본 배송비는 0원 이상이어야 합니다.'));
    }
    if (props.freeShippingThreshold < 0) {
      return fail(new ValidationError('무료배송 기준 금액은 0원 이상이어야 합니다.'));
    }
    if (props.purchaseRewardRate < 0 || props.purchaseRewardRate > 100) {
      return fail(new ValidationError('구매 적립률은 0% 이상 100% 이하이어야 합니다.'));
    }

    return ok(new StoreSettings(props, id));
  }

  public static createDefault(): StoreSettings {
    return new StoreSettings({
      storeName: 'CommerceHub 공식스토어',
      representativeName: '김은영',
      businessNumber: '214-88-91204',
      ecommercePermitNumber: '2024-서울강남-03891호',
      csPhone: '1588-4920',
      csEmail: 'support@commercehub.co.kr',
      address: '서울특별시 강남구 테헤란로 427, 위워크타워 14층 1402호',
      zipcode: '06164',
      logoHeaderUrl: null,
      logoMobileUrl: null,
      faviconUrl: null,
      isOperating: true,
      requireAdultVerification: false,
      allowGuestOrder: true,
      defaultShippingFee: 3000,
      freeShippingThreshold: 50000,
      islandMountainShippingFee: 3000,
      purchaseRewardRate: 1.5,
      textReviewReward: 500,
      photoReviewReward: 1500,
      welcomeReward: 3000,
      updatedAt: new Date(),
      updatedBy: null,
    });
  }

  // Getters
  public get storeName(): string {
    return this.props.storeName;
  }
  public get representativeName(): string {
    return this.props.representativeName;
  }
  public get businessNumber(): string {
    return this.props.businessNumber;
  }
  public get ecommercePermitNumber(): string {
    return this.props.ecommercePermitNumber;
  }
  public get csPhone(): string {
    return this.props.csPhone;
  }
  public get csEmail(): string {
    return this.props.csEmail;
  }
  public get address(): string {
    return this.props.address;
  }
  public get zipcode(): string {
    return this.props.zipcode;
  }
  public get logoHeaderUrl(): string | null | undefined {
    return this.props.logoHeaderUrl;
  }
  public get logoMobileUrl(): string | null | undefined {
    return this.props.logoMobileUrl;
  }
  public get faviconUrl(): string | null | undefined {
    return this.props.faviconUrl;
  }
  public get isOperating(): boolean {
    return this.props.isOperating;
  }
  public get requireAdultVerification(): boolean {
    return this.props.requireAdultVerification;
  }
  public get allowGuestOrder(): boolean {
    return this.props.allowGuestOrder;
  }
  public get defaultShippingFee(): number {
    return this.props.defaultShippingFee;
  }
  public get freeShippingThreshold(): number {
    return this.props.freeShippingThreshold;
  }
  public get islandMountainShippingFee(): number {
    return this.props.islandMountainShippingFee;
  }
  public get purchaseRewardRate(): number {
    return this.props.purchaseRewardRate;
  }
  public get textReviewReward(): number {
    return this.props.textReviewReward;
  }
  public get photoReviewReward(): number {
    return this.props.photoReviewReward;
  }
  public get welcomeReward(): number {
    return this.props.welcomeReward;
  }
  public get updatedAt(): Date {
    return this.props.updatedAt;
  }
  public get updatedBy(): string | null | undefined {
    return this.props.updatedBy;
  }

  // Business Update Methods
  public updateBusinessInfo(info: {
    storeName: string;
    representativeName: string;
    businessNumber: string;
    ecommercePermitNumber: string;
    csPhone: string;
    csEmail: string;
    address: string;
    zipcode: string;
  }): Result<void, ValidationError> {
    if (!info.storeName || info.storeName.trim().length === 0) {
      return fail(new ValidationError('스토어 상호명을 입력해야 합니다.'));
    }
    if (!info.representativeName || info.representativeName.trim().length === 0) {
      return fail(new ValidationError('대표자명을 입력해야 합니다.'));
    }

    this.props.storeName = info.storeName.trim();
    this.props.representativeName = info.representativeName.trim();
    this.props.businessNumber = info.businessNumber.trim();
    this.props.ecommercePermitNumber = info.ecommercePermitNumber.trim();
    this.props.csPhone = info.csPhone.trim();
    this.props.csEmail = info.csEmail.trim();
    this.props.address = info.address.trim();
    this.props.zipcode = info.zipcode.trim();
    this.props.updatedAt = new Date();
    return ok(undefined);
  }

  public updateShippingPolicy(policy: {
    defaultShippingFee: number;
    freeShippingThreshold: number;
    islandMountainShippingFee: number;
  }): Result<void, ValidationError> {
    if (policy.defaultShippingFee < 0) {
      return fail(new ValidationError('기본 배송비는 0원 이상이어야 합니다.'));
    }
    if (policy.freeShippingThreshold < 0) {
      return fail(new ValidationError('무료배송 기준 금액은 0원 이상이어야 합니다.'));
    }

    this.props.defaultShippingFee = policy.defaultShippingFee;
    this.props.freeShippingThreshold = policy.freeShippingThreshold;
    this.props.islandMountainShippingFee = policy.islandMountainShippingFee;
    this.props.updatedAt = new Date();
    return ok(undefined);
  }

  public updateRewardPolicy(policy: {
    purchaseRewardRate: number;
    textReviewReward: number;
    photoReviewReward: number;
    welcomeReward: number;
  }): Result<void, ValidationError> {
    if (policy.purchaseRewardRate < 0 || policy.purchaseRewardRate > 100) {
      return fail(new ValidationError('구매 적립률은 0% 이상 100% 이하이어야 합니다.'));
    }

    this.props.purchaseRewardRate = policy.purchaseRewardRate;
    this.props.textReviewReward = policy.textReviewReward;
    this.props.photoReviewReward = policy.photoReviewReward;
    this.props.welcomeReward = policy.welcomeReward;
    this.props.updatedAt = new Date();
    return ok(undefined);
  }

  public updateOperatingPolicy(policy: {
    isOperating: boolean;
    requireAdultVerification: boolean;
    allowGuestOrder: boolean;
  }): void {
    this.props.isOperating = policy.isOperating;
    this.props.requireAdultVerification = policy.requireAdultVerification;
    this.props.allowGuestOrder = policy.allowGuestOrder;
    this.props.updatedAt = new Date();
  }
}
