import { Entity } from '../../shared/Entity';
import { Result, ok, fail } from '../../shared/Result';
import { DomainError } from '../../shared/AppError';
import { Money } from '../../catalog/value-objects/Money';

export interface CustomerCouponProps {
  customerId: string;
  name: string;
  discountAmount?: number | null;
  discountRate?: number | null;
  minOrderAmount: number;
  isUsed: boolean;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * 고객 보유 쿠폰 도메인 엔티티
 * 정액/정률 할인 계산, 유효기간 만료 검증, 최소 주문금액 충족 여부를 캡슐화합니다.
 */
export class CustomerCoupon extends Entity<CustomerCouponProps> {
  private constructor(props: CustomerCouponProps, id?: string) {
    super(props, id);
  }

  get customerId(): string { return this.props.customerId; }
  get name(): string { return this.props.name; }
  get discountAmount(): number | null | undefined { return this.props.discountAmount; }
  get discountRate(): number | null | undefined { return this.props.discountRate; }
  get minOrderAmount(): number { return this.props.minOrderAmount; }
  get isUsed(): boolean { return this.props.isUsed; }
  get expiresAt(): Date { return this.props.expiresAt; }
  get createdAt(): Date { return this.props.createdAt; }

  /**
   * 쿠폰 만료 여부 확인
   */
  public isExpired(asOf: Date = new Date()): boolean {
    return asOf.getTime() > this.props.expiresAt.getTime();
  }

  /**
   * 주문 금액에 대해 쿠폰 사용 가능 여부 판정
   */
  public isUsable(orderAmount: number, asOf: Date = new Date()): boolean {
    if (this.props.isUsed) return false;
    if (this.isExpired(asOf)) return false;
    if (orderAmount < this.props.minOrderAmount) return false;
    return true;
  }

  /**
   * 주문 금액에 따른 실제 할인 금액 계산
   */
  public calculateDiscount(orderAmount: number, asOf: Date = new Date()): Money {
    if (!this.isUsable(orderAmount, asOf)) {
      return Money.zero();
    }

    // 1. 정액 할인 적용
    if (this.props.discountAmount && this.props.discountAmount > 0) {
      const discount = Math.min(this.props.discountAmount, orderAmount);
      return Money.create(discount);
    }

    // 2. 정률 할인 적용
    if (this.props.discountRate && this.props.discountRate > 0) {
      const rateDiscount = Math.floor(orderAmount * (this.props.discountRate / 100));
      const discount = Math.min(rateDiscount, orderAmount);
      return Money.create(discount);
    }

    return Money.zero();
  }

  /**
   * 쿠폰 사용 처리
   */
  public markAsUsed(orderAmount: number, asOf: Date = new Date()): Result<void, DomainError> {
    if (this.props.isUsed) {
      return fail(new DomainError('이미 사용된 쿠폰입니다.'));
    }
    if (this.isExpired(asOf)) {
      return fail(new DomainError('사용 기한이 만료된 쿠폰입니다.'));
    }
    if (orderAmount < this.props.minOrderAmount) {
      return fail(
        new DomainError(
          `최소 주문 금액(${this.props.minOrderAmount.toLocaleString()}원)을 충족하지 못했습니다.`
        )
      );
    }

    this.props.isUsed = true;
    return ok();
  }

  /**
   * 쿠폰 복원 (주문 취소/환불 시)
   */
  public restore(): void {
    this.props.isUsed = false;
  }

  public static create(
    props: Omit<CustomerCouponProps, 'createdAt' | 'isUsed'> & {
      isUsed?: boolean;
      createdAt?: Date;
    },
    id?: string
  ): Result<CustomerCoupon, DomainError> {
    if (!props.customerId || !props.customerId.trim()) {
      return fail(new DomainError('고객 ID는 필수입니다.'));
    }
    if (!props.name || !props.name.trim()) {
      return fail(new DomainError('쿠폰명은 필수입니다.'));
    }
    if (!props.discountAmount && !props.discountRate) {
      return fail(new DomainError('정액 할인 금액 또는 정률 할인율 중 하나는 반드시 지정되어야 합니다.'));
    }
    if (props.discountRate !== undefined && props.discountRate !== null) {
      if (props.discountRate < 1 || props.discountRate > 100) {
        return fail(new DomainError('할인율은 1% 이상 100% 이하여야 합니다.'));
      }
    }
    if (props.discountAmount !== undefined && props.discountAmount !== null) {
      if (props.discountAmount <= 0) {
        return fail(new DomainError('할인 금액은 0원보다 커야 합니다.'));
      }
    }
    if (props.minOrderAmount < 0) {
      return fail(new DomainError('최소 주문 금액은 0원 이상이어야 합니다.'));
    }

    const coupon = new CustomerCoupon(
      {
        ...props,
        isUsed: props.isUsed ?? false,
        createdAt: props.createdAt ?? new Date(),
      },
      id
    );

    return ok(coupon);
  }
}
