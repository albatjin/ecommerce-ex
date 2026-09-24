import { Entity } from '../../shared/Entity';
import { Result, ok, fail } from '../../shared/Result';
import { DomainError } from '../../shared/AppError';
import { Money } from '../../catalog/value-objects/Money';

export interface CartItemProps {
  productId: string;
  variantId?: string | null;
  productName: string;
  variantName?: string | null;
  price: Money;
  quantity: number;
  coverImageUrl?: string | null;
  shippingFee: Money;
  selected: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 장바구니 품목 도메인 엔티티
 */
export class CartItem extends Entity<CartItemProps> {
  private constructor(props: CartItemProps, id?: string) {
    super(props, id);
  }

  get productId(): string { return this.props.productId; }
  get variantId(): string | null | undefined { return this.props.variantId; }
  get productName(): string { return this.props.productName; }
  get variantName(): string | null | undefined { return this.props.variantName; }
  get price(): Money { return this.props.price; }
  get quantity(): number { return this.props.quantity; }
  get coverImageUrl(): string | null | undefined { return this.props.coverImageUrl; }
  get shippingFee(): Money { return this.props.shippingFee; }
  get selected(): boolean { return this.props.selected; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  /**
   * 품목 소계 (단가 * 수량)
   */
  public subtotal(): Money {
    return this.props.price.multiply(this.props.quantity);
  }

  /**
   * 수량 변경
   */
  public updateQuantity(newQuantity: number): Result<void, DomainError> {
    if (newQuantity < 1) {
      return fail(new DomainError('수량은 1개 이상이어야 합니다.'));
    }
    if (newQuantity > 99) {
      return fail(new DomainError('1회 최대 주문 가능 수량은 99개입니다.'));
    }

    this.props.quantity = newQuantity;
    this.props.updatedAt = new Date();
    return ok();
  }

  /**
   * 수량 추가 (동일 상품 중복 담기 시)
   */
  public addQuantity(amount: number): Result<void, DomainError> {
    return this.updateQuantity(this.props.quantity + amount);
  }

  /**
   * 선택 여부 토글
   */
  public toggleSelect(): void {
    this.props.selected = !this.props.selected;
    this.props.updatedAt = new Date();
  }

  /**
   * 선택 여부 지정
   */
  public setSelected(selected: boolean): void {
    this.props.selected = selected;
    this.props.updatedAt = new Date();
  }

  /**
   * 동일 품목 식별 키 (상품 ID + 옵션 ID 조합)
   */
  public getItemKey(): string {
    return `${this.props.productId}_${this.props.variantId || 'default'}`;
  }

  public static create(
    props: Omit<CartItemProps, 'createdAt' | 'updatedAt' | 'selected'> & {
      selected?: boolean;
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: string
  ): Result<CartItem, DomainError> {
    if (!props.productId || !props.productId.trim()) {
      return fail(new DomainError('상품 ID는 필수입니다.'));
    }
    if (!props.productName || !props.productName.trim()) {
      return fail(new DomainError('상품명은 필수입니다.'));
    }
    if (props.quantity < 1) {
      return fail(new DomainError('수량은 1개 이상이어야 합니다.'));
    }
    if (props.quantity > 99) {
      return fail(new DomainError('1회 최대 주문 가능 수량은 99개입니다.'));
    }

    const now = new Date();
    const item = new CartItem(
      {
        ...props,
        selected: props.selected ?? true,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id
    );

    return ok(item);
  }
}

