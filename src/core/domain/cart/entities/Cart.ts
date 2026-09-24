import { Entity } from '../../shared/Entity';
import { Result, ok, fail } from '../../shared/Result';
import { DomainError } from '../../shared/AppError';
import { Money } from '../../catalog/value-objects/Money';
import { CartItem } from './CartItem';

export interface CartProps {
  userId?: string | null;
  items: CartItem[];
  updatedAt: Date;
}

/**
 * 장바구니 도메인 엔티티 (Aggregate Root)
 */
export class Cart extends Entity<CartProps> {
  // 무료배송 기준 금액 (50,000원 이상 구매 시 무료배송)
  public static readonly FREE_SHIPPING_THRESHOLD = 50000;

  private constructor(props: CartProps, id?: string) {
    super(props, id);
  }

  get userId(): string | null | undefined { return this.props.userId; }
  get items(): CartItem[] { return this.props.items; }
  get updatedAt(): Date { return this.props.updatedAt; }

  /**
   * 품목 추가 (동일 상품/옵션 존재 시 수량 합산)
   */
  public addItem(newItem: CartItem): void {
    const existingIndex = this.props.items.findIndex(
      (item) => item.getItemKey() === newItem.getItemKey()
    );

    if (existingIndex > -1) {
      const existing = this.props.items[existingIndex];
      existing.addQuantity(newItem.quantity);
    } else {
      this.props.items.push(newItem);
    }

    this.props.updatedAt = new Date();
  }

  /**
   * 품목 수량 변경
   */
  public updateItemQuantity(itemId: string, quantity: number): Result<void, DomainError> {
    const item = this.props.items.find((i) => i.id === itemId);
    if (!item) {
      return fail(new DomainError('장바구니에서 해당 품목을 찾을 수 없습니다.'));
    }

    const result = item.updateQuantity(quantity);
    if (result.isSuccess) {
      this.props.updatedAt = new Date();
    }
    return result;
  }

  /**
   * 특정 품목 삭제
   */
  public removeItem(itemId: string): void {
    this.props.items = this.props.items.filter((i) => i.id !== itemId);
    this.props.updatedAt = new Date();
  }

  /**
   * 선택된 품목 일괄 삭제
   */
  public removeSelectedItems(): void {
    this.props.items = this.props.items.filter((i) => !i.selected);
    this.props.updatedAt = new Date();
  }

  /**
   * 장바구니 비우기
   */
  public clear(): void {
    this.props.items = [];
    this.props.updatedAt = new Date();
  }

  /**
   * 특정 품목 선택 여부 토글
   */
  public toggleItemSelect(itemId: string): void {
    const item = this.props.items.find((i) => i.id === itemId);
    if (item) {
      item.toggleSelect();
      this.props.updatedAt = new Date();
    }
  }

  /**
   * 전체 품목 선택/해제
   */
  public selectAll(selected: boolean): void {
    for (const item of this.props.items) {
      item.setSelected(selected);
    }
    this.props.updatedAt = new Date();
  }

  /**
   * 모든 품목이 선택되어 있는지 여부
   */
  public isAllSelected(): boolean {
    if (this.props.items.length === 0) return false;
    return this.props.items.every((i) => i.selected);
  }

  /**
   * 현재 선택된 주문 대상 품목 목록
   */
  public selectedItems(): CartItem[] {
    return this.props.items.filter((i) => i.selected);
  }

  /**
   * 선택된 상품 총 금액 합계
   */
  public totalProductAmount(): Money {
    return this.selectedItems().reduce(
      (sum, item) => sum.add(item.subtotal()),
      Money.zero()
    );
  }

  /**
   * 총 배송비 계산 (50,000원 이상 구매 시 무료배송 정책)
   */
  public totalShippingFee(): Money {
    const selected = this.selectedItems();
    if (selected.length === 0) return Money.zero();

    const productTotal = this.totalProductAmount();
    if (productTotal.amount >= Cart.FREE_SHIPPING_THRESHOLD) {
      return Money.zero();
    }

    // 선택된 품목 중 최대 배송비 적용
    let maxFee = Money.zero();
    for (const item of selected) {
      if (item.shippingFee.amount > maxFee.amount) {
        maxFee = item.shippingFee;
      }
    }
    return maxFee;
  }

  /**
   * 최종 결제 예상 금액 (상품금액 + 배송비)
   */
  public totalPaymentAmount(): Money {
    return this.totalProductAmount().add(this.totalShippingFee());
  }

  /**
   * 장바구니 전체 담긴 수량 합산
   */
  public totalItemCount(): number {
    return this.props.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  /**
   * 게스트(비회원) 장바구니를 회원 장바구니로 병합 (동기화 전략)
   */
  public merge(guestCart: Cart): void {
    for (const guestItem of guestCart.items) {
      this.addItem(guestItem);
    }
    this.props.updatedAt = new Date();
  }

  public static create(
    props?: Partial<CartProps>,
    id?: string
  ): Result<Cart, DomainError> {
    const now = new Date();
    const cart = new Cart(
      {
        userId: props?.userId ?? null,
        items: props?.items ?? [],
        updatedAt: props?.updatedAt ?? now,
      },
      id
    );

    return ok(cart);
  }
}

