import { ValueObject } from '../../shared/ValueObject';
import { DomainError } from '../../shared/AppError';

export interface StockProps {
  quantity: number;
  safetyStock: number;
}

/**
 * 상품 재고 수량 및 안전 재고를 관리하는 불변 값 객체
 */
export class Stock extends ValueObject<StockProps> {
  private constructor(props: StockProps) {
    super(props);
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get safetyStock(): number {
    return this.props.safetyStock;
  }

  public static create(quantity: number, safetyStock = 10): Stock {
    if (quantity < 0) {
      throw new DomainError('재고 수량은 음수일 수 없습니다.');
    }
    if (safetyStock < 0) {
      throw new DomainError('안전재고 수량은 음수일 수 없습니다.');
    }
    return new Stock({ quantity, safetyStock });
  }

  public isOutOfStock(): boolean {
    return this.props.quantity <= 0;
  }

  public isLowStock(): boolean {
    return !this.isOutOfStock() && this.props.quantity <= this.props.safetyStock;
  }

  public hasEnough(requiredQuantity: number): boolean {
    if (requiredQuantity <= 0) return false;
    return this.props.quantity >= requiredQuantity;
  }

  public deduct(amount: number): Stock {
    if (amount <= 0) {
      throw new DomainError('차감할 수량은 0보다 커야 합니다.');
    }
    if (this.props.quantity < amount) {
      throw new DomainError(`재고가 부족합니다 (현재 재고: ${this.props.quantity}개, 요청: ${amount}개).`);
    }
    return new Stock({
      quantity: this.props.quantity - amount,
      safetyStock: this.props.safetyStock,
    });
  }

  public restock(amount: number): Stock {
    if (amount <= 0) {
      throw new DomainError('입고할 수량은 0보다 커야 합니다.');
    }
    return new Stock({
      quantity: this.props.quantity + amount,
      safetyStock: this.props.safetyStock,
    });
  }
}
