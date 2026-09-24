import { Entity } from '../../shared/Entity';
import { Result, ok, fail } from '../../shared/Result';
import { DomainError } from '../../shared/AppError';
import { Money } from '../value-objects/Money';
import { Stock } from '../value-objects/Stock';
import type { VariantStatus } from '@/shared/types/database.types';

export interface ProductVariantProps {
  productId: string;
  skuCode: string;
  variantName: string;
  options: Record<string, string>;
  additionalPrice: Money;
  stock: Stock;
  status: VariantStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 상품 옵션 SKU 도메인 엔티티
 */
export class ProductVariant extends Entity<ProductVariantProps> {
  private constructor(props: ProductVariantProps, id?: string) {
    super(props, id);
  }

  get productId(): string { return this.props.productId; }
  get skuCode(): string { return this.props.skuCode; }
  get variantName(): string { return this.props.variantName; }
  get options(): Record<string, string> { return this.props.options; }
  get additionalPrice(): Money { return this.props.additionalPrice; }
  get stock(): Stock { return this.props.stock; }
  get status(): VariantStatus { return this.props.status; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  public isAvailable(): boolean {
    return this.props.status !== 'OUT_OF_STOCK' && !this.props.stock.isOutOfStock();
  }

  public deductStock(amount: number): void {
    this.props.stock = this.props.stock.deduct(amount);
    if (this.props.stock.isOutOfStock()) {
      this.props.status = 'OUT_OF_STOCK';
    } else if (this.props.stock.isLowStock()) {
      this.props.status = 'LOW_STOCK';
    }
    this.props.updatedAt = new Date();
  }

  public restock(amount: number): void {
    this.props.stock = this.props.stock.restock(amount);
    if (this.props.stock.isLowStock()) {
      this.props.status = 'LOW_STOCK';
    } else {
      this.props.status = 'ACTIVE';
    }
    this.props.updatedAt = new Date();
  }

  public static create(
    props: Omit<ProductVariantProps, 'createdAt' | 'updatedAt' | 'status'> & {
      status?: VariantStatus;
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: string
  ): Result<ProductVariant, DomainError> {
    if (!props.skuCode || !props.skuCode.trim()) {
      return fail(new DomainError('SKU 코드는 필수 항목입니다.'));
    }
    if (!props.variantName || !props.variantName.trim()) {
      return fail(new DomainError('옵션명은 필수 항목입니다.'));
    }

    const now = new Date();
    const status: VariantStatus =
      props.status ?? (props.stock.isOutOfStock() ? 'OUT_OF_STOCK' : 'ACTIVE');

    const variant = new ProductVariant(
      {
        ...props,
        status,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id
    );

    return ok(variant);
  }
}
