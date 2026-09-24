import { Entity } from '../../shared/Entity';
import { Result, ok, fail } from '../../shared/Result';
import { DomainError } from '../../shared/AppError';
import { Money } from '../../catalog/value-objects/Money';
import { OrderNumber } from '../value-objects/OrderNumber';
import { ShippingAddress } from '../value-objects/ShippingAddress';
import { PaymentInfo } from '../value-objects/PaymentInfo';
import { OrderItem } from './OrderItem';
import type { OrderStatus } from '@/shared/types/database.types';

export interface OrderProps {
  orderNumber: OrderNumber;
  customerId?: string | null;
  orderName: string;
  items: OrderItem[];
  status: OrderStatus;
  totalProductAmount: Money;
  discountAmount: Money;
  pointUsed: Money;
  shippingFee: Money;
  totalPaidAmount: Money;
  paymentInfo: PaymentInfo;
  shippingAddress: ShippingAddress;
  trackingCompany?: string | null;
  trackingNumber?: string | null;
  paidAt?: Date | null;
  shippedAt?: Date | null;
  deliveredAt?: Date | null;
  cancelledAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 주문 도메인 엔티티 (Aggregate Root)
 * 주문 생애주기 전반의 상태 전이 머신(Status State Machine)과 금액 정합성을 보장합니다.
 */
export class Order extends Entity<OrderProps> {
  private constructor(props: OrderProps, id?: string) {
    super(props, id);
  }

  get orderNumber(): OrderNumber { return this.props.orderNumber; }
  get customerId(): string | null | undefined { return this.props.customerId; }
  get orderName(): string { return this.props.orderName; }
  get items(): OrderItem[] { return this.props.items; }
  get status(): OrderStatus { return this.props.status; }
  get totalProductAmount(): Money { return this.props.totalProductAmount; }
  get discountAmount(): Money { return this.props.discountAmount; }
  get pointUsed(): Money { return this.props.pointUsed; }
  get shippingFee(): Money { return this.props.shippingFee; }
  get totalPaidAmount(): Money { return this.props.totalPaidAmount; }
  get paymentInfo(): PaymentInfo { return this.props.paymentInfo; }
  get shippingAddress(): ShippingAddress { return this.props.shippingAddress; }
  get trackingCompany(): string | null | undefined { return this.props.trackingCompany; }
  get trackingNumber(): string | null | undefined { return this.props.trackingNumber; }
  get paidAt(): Date | null | undefined { return this.props.paidAt; }
  get shippedAt(): Date | null | undefined { return this.props.shippedAt; }
  get deliveredAt(): Date | null | undefined { return this.props.deliveredAt; }
  get cancelledAt(): Date | null | undefined { return this.props.cancelledAt; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // -------------------------------------------------------------
  // 상태 전이 머신 (Order Status State Machine)
  // -------------------------------------------------------------

  /**
   * 결제 완료 처리: PAYMENT_PENDING -> PAID
   */
  public markAsPaid(paidAt: Date = new Date(), details?: Record<string, unknown>): Result<void, DomainError> {
    if (this.props.status !== 'PAYMENT_PENDING') {
      return fail(new DomainError(`'${this.props.status}' 상태에서는 결제 완료로 전환할 수 없습니다.`));
    }

    this.props.status = 'PAID';
    this.props.paidAt = paidAt;
    this.props.paymentInfo = this.props.paymentInfo.markAsCompleted(paidAt, details);
    this.props.updatedAt = new Date();

    for (const item of this.props.items) {
      item.updateStatus('ORDERED');
    }

    return ok();
  }

  /**
   * 상품 준비 중 전환: PAID -> PREPARING
   */
  public markAsPreparing(): Result<void, DomainError> {
    if (this.props.status !== 'PAID') {
      return fail(new DomainError(`결제 완료('PAID') 상태의 주문만 배송 준비 상태로 전환할 수 있습니다.`));
    }

    this.props.status = 'PREPARING';
    this.props.updatedAt = new Date();

    for (const item of this.props.items) {
      item.updateStatus('PREPARING');
    }

    return ok();
  }

  /**
   * 배송 시작 처리: PREPARING (또는 PAID) -> SHIPPING
   */
  public markAsShipping(
    trackingCompany: string,
    trackingNumber: string,
    shippedAt: Date = new Date()
  ): Result<void, DomainError> {
    if (this.props.status !== 'PREPARING' && this.props.status !== 'PAID') {
      return fail(new DomainError(`준비 중('PREPARING') 또는 결제완료('PAID') 상태에서만 배송을 시작할 수 있습니다.`));
    }
    if (!trackingCompany.trim() || !trackingNumber.trim()) {
      return fail(new DomainError('택배사 및 송장 번호는 필수 입력 항목입니다.'));
    }

    this.props.status = 'SHIPPING';
    this.props.trackingCompany = trackingCompany.trim();
    this.props.trackingNumber = trackingNumber.trim();
    this.props.shippedAt = shippedAt;
    this.props.updatedAt = new Date();

    for (const item of this.props.items) {
      item.updateStatus('SHIPPED');
    }

    return ok();
  }

  /**
   * 배송 완료 처리: SHIPPING -> DELIVERED
   */
  public markAsDelivered(deliveredAt: Date = new Date()): Result<void, DomainError> {
    if (this.props.status !== 'SHIPPING') {
      return fail(new DomainError(`배송 중('SHIPPING') 상태의 주문만 배송 완료로 전환할 수 있습니다.`));
    }

    this.props.status = 'DELIVERED';
    this.props.deliveredAt = deliveredAt;
    this.props.updatedAt = new Date();

    for (const item of this.props.items) {
      item.updateStatus('DELIVERED');
    }

    return ok();
  }

  /**
   * 주문 취소 요청: PAYMENT_PENDING 또는 PAID -> CANCEL_REQUESTED
   */
  public requestCancel(): Result<void, DomainError> {
    if (this.props.status !== 'PAYMENT_PENDING' && this.props.status !== 'PAID') {
      return fail(new DomainError('결제 대기 또는 결제 완료 상태에서만 취소를 요청할 수 있습니다.'));
    }

    this.props.status = 'CANCEL_REQUESTED';
    this.props.updatedAt = new Date();

    for (const item of this.props.items) {
      item.updateStatus('CANCEL_REQUESTED');
    }

    return ok();
  }

  /**
   * 주문 취소 승인/확정: PAYMENT_PENDING, PAID, CANCEL_REQUESTED -> CANCELLED
   */
  public cancel(cancelledAt: Date = new Date()): Result<void, DomainError> {
    const cancellableStatuses: OrderStatus[] = ['PAYMENT_PENDING', 'PAID', 'CANCEL_REQUESTED'];
    if (!cancellableStatuses.includes(this.props.status)) {
      return fail(new DomainError(`'${this.props.status}' 상태에서는 주문을 취소할 수 없습니다. 배송 후에는 반품을 진행해 주세요.`));
    }

    this.props.status = 'CANCELLED';
    this.props.cancelledAt = cancelledAt;
    this.props.updatedAt = new Date();

    if (this.props.paymentInfo.isCompleted()) {
      this.props.paymentInfo = this.props.paymentInfo.markAsRefunded();
    }

    for (const item of this.props.items) {
      item.updateStatus('CANCELLED');
    }

    return ok();
  }

  /**
   * 반품 요청: DELIVERED -> RETURN_REQUESTED
   */
  public requestReturn(): Result<void, DomainError> {
    if (this.props.status !== 'DELIVERED') {
      return fail(new DomainError(`배송 완료('DELIVERED') 상태의 주문만 반품을 요청할 수 있습니다.`));
    }

    this.props.status = 'RETURN_REQUESTED';
    this.props.updatedAt = new Date();

    for (const item of this.props.items) {
      item.updateStatus('RETURNED');
    }

    return ok();
  }

  /**
   * 반품 완료: RETURN_REQUESTED -> RETURNED
   */
  public completeReturn(): Result<void, DomainError> {
    if (this.props.status !== 'RETURN_REQUESTED') {
      return fail(new DomainError(`반품 요청('RETURN_REQUESTED') 상태의 주문만 반품 완료로 전환할 수 있습니다.`));
    }

    this.props.status = 'RETURNED';
    this.props.paymentInfo = this.props.paymentInfo.markAsRefunded();
    this.props.updatedAt = new Date();

    for (const item of this.props.items) {
      item.updateStatus('RETURNED');
    }

    return ok();
  }

  /**
   * 반품 거절/반려: RETURN_REQUESTED -> DELIVERED
   */
  public rejectReturn(): Result<void, DomainError> {
    if (this.props.status !== 'RETURN_REQUESTED') {
      return fail(new DomainError(`반품 요청('RETURN_REQUESTED') 상태의 주문만 반품을 거절할 수 있습니다.`));
    }

    this.props.status = 'DELIVERED';
    this.props.updatedAt = new Date();

    for (const item of this.props.items) {
      item.updateStatus('DELIVERED');
    }

    return ok();
  }

  public static create(
    props: Omit<OrderProps, 'createdAt' | 'updatedAt' | 'totalPaidAmount'> & {
      totalPaidAmount?: Money;
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: string
  ): Result<Order, DomainError> {
    if (props.items.length === 0) {
      return fail(new DomainError('주문에는 최소 1개 이상의 품목이 포함되어야 합니다.'));
    }

    // 최종 결제 금액 = 상품금액 - 쿠폰할인 - 적립금 + 배송비
    const calculatedPaidAmount =
      props.totalPaidAmount ??
      props.totalProductAmount
        .subtract(props.discountAmount)
        .subtract(props.pointUsed)
        .add(props.shippingFee);

    const now = new Date();
    const order = new Order(
      {
        ...props,
        totalPaidAmount: calculatedPaidAmount,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id
    );

    return ok(order);
  }
}

