import { Entity } from '../../shared/Entity';
import { Result, ok, fail } from '../../shared/Result';
import { DomainError } from '../../shared/AppError';
import { Money } from '../../catalog/value-objects/Money';
import type { OrderItemStatus } from '@/shared/types/database.types';

export interface OrderItemProps {
  productId?: string | null;
  variantId?: string | null;
  productName: string;
  variantName?: string | null;
  productImageUrl?: string | null;
  skuCode?: string | null;
  unitPrice: Money;
  quantity: number;
  discountAmount: Money;
  totalPrice: Money;
  status: OrderItemStatus;
  createdAt: Date;
}

/**
 * 주문 개별 품목 엔티티 (불변 주문 스냅샷)
 */
export class OrderItem extends Entity<OrderItemProps> {
  private constructor(props: OrderItemProps, id?: string) {
    super(props, id);
  }

  get productId(): string | null | undefined { return this.props.productId; }
  get variantId(): string | null | undefined { return this.props.variantId; }
  get productName(): string { return this.props.productName; }
  get variantName(): string | null | undefined { return this.props.variantName; }
  get productImageUrl(): string | null | undefined { return this.props.productImageUrl; }
  get skuCode(): string | null | undefined { return this.props.skuCode; }
  get unitPrice(): Money { return this.props.unitPrice; }
  get quantity(): number { return this.props.quantity; }
  get discountAmount(): Money { return this.props.discountAmount; }
  get totalPrice(): Money { return this.props.totalPrice; }
  get status(): OrderItemStatus { return this.props.status; }
  get createdAt(): Date { return this.props.createdAt; }

  public updateStatus(newStatus: OrderItemStatus): void {
    this.props.status = newStatus;
  }

  public static create(
    props: Omit<OrderItemProps, 'totalPrice' | 'createdAt' | 'status'> & {
      totalPrice?: Money;
      status?: OrderItemStatus;
      createdAt?: Date;
    },
    id?: string
  ): Result<OrderItem, DomainError> {
    if (!props.productName || !props.productName.trim()) {
      return fail(new DomainError('주문 품목명은 필수입니다.'));
    }
    if (props.quantity <= 0) {
      return fail(new DomainError('주문 수량은 1개 이상이어야 합니다.'));
    }

    const calculatedTotal =
      props.totalPrice ??
      props.unitPrice.multiply(props.quantity).subtract(props.discountAmount);

    const item = new OrderItem(
      {
        ...props,
        totalPrice: calculatedTotal,
        status: props.status ?? 'ORDERED',
        createdAt: props.createdAt ?? new Date(),
      },
      id
    );

    return ok(item);
  }
}
