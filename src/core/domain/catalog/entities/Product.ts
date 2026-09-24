import { Entity } from '../../shared/Entity';
import { Result, ok, fail } from '../../shared/Result';
import { DomainError } from '../../shared/AppError';
import { Money } from '../value-objects/Money';
import { Stock } from '../value-objects/Stock';
import { Discount } from '../value-objects/Discount';
import { ProductVariant } from './ProductVariant';
import type { ProductTaxType, ProductStatus } from '@/shared/types/database.types';

export interface ProductProps {
  productCode: string;
  nameKo: string;
  nameEn?: string | null;
  categoryId?: string | null;
  discount: Discount;
  taxType: ProductTaxType;
  maxOrderQuantity: number;
  stock: Stock;
  status: ProductStatus;
  skuCode?: string | null;
  manufacturer?: string | null;
  brandName?: string | null;
  description?: string | null;
  coverImageUrl?: string | null;
  additionalImages: string[];
  shippingFee: Money;
  originAddress?: string | null;
  variants: ProductVariant[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateProductDTO {
  nameKo?: string;
  nameEn?: string | null;
  categoryId?: string | null;
  discount?: Discount;
  taxType?: ProductTaxType;
  maxOrderQuantity?: number;
  manufacturer?: string | null;
  brandName?: string | null;
  description?: string | null;
  coverImageUrl?: string | null;
  additionalImages?: string[];
  shippingFee?: Money;
  originAddress?: string | null;
}

/**
 * 상품 도메인 엔티티 (Aggregate Root)
 */
export class Product extends Entity<ProductProps> {
  private constructor(props: ProductProps, id?: string) {
    super(props, id);
  }

  get productCode(): string { return this.props.productCode; }
  get nameKo(): string { return this.props.nameKo; }
  get nameEn(): string | null | undefined { return this.props.nameEn; }
  get categoryId(): string | null | undefined { return this.props.categoryId; }
  get regularPrice(): Money { return this.props.discount.regularPrice; }
  get salePrice(): Money { return this.props.discount.salePrice; }
  get discountRate(): number { return this.props.discount.discountRate; }
  get discount(): Discount { return this.props.discount; }
  get taxType(): ProductTaxType { return this.props.taxType; }
  get maxOrderQuantity(): number { return this.props.maxOrderQuantity; }
  get stock(): Stock { return this.props.stock; }
  get status(): ProductStatus { return this.props.status; }
  get skuCode(): string | null | undefined { return this.props.skuCode; }
  get manufacturer(): string | null | undefined { return this.props.manufacturer; }
  get brandName(): string | null | undefined { return this.props.brandName; }
  get description(): string | null | undefined { return this.props.description; }
  get coverImageUrl(): string | null | undefined { return this.props.coverImageUrl; }
  get additionalImages(): string[] { return this.props.additionalImages; }
  get shippingFee(): Money { return this.props.shippingFee; }
  get originAddress(): string | null | undefined { return this.props.originAddress; }
  get variants(): ProductVariant[] { return this.props.variants; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  /**
   * 주문 가능한 상태인지 판별
   */
  public isOrderable(requestedQuantity = 1): boolean {
    if (this.props.status !== 'ACTIVE') return false;
    if (requestedQuantity <= 0) return false;
    if (requestedQuantity > this.props.maxOrderQuantity) return false;
    return this.props.stock.hasEnough(requestedQuantity);
  }

  /**
   * 재고 차감 (0 이하가 되면 OUT_OF_STOCK으로 전이)
   */
  public deductStock(amount: number): void {
    this.props.stock = this.props.stock.deduct(amount);
    if (this.props.stock.isOutOfStock()) {
      this.props.status = 'OUT_OF_STOCK';
    }
    this.props.updatedAt = new Date();
  }

  /**
   * 재고 입고 (품절 상태였던 경우 ACTIVE로 전이)
   */
  public restock(amount: number): void {
    this.props.stock = this.props.stock.restock(amount);
    if (this.props.status === 'OUT_OF_STOCK') {
      this.props.status = 'ACTIVE';
    }
    this.props.updatedAt = new Date();
  }

  /**
   * 상태 변경
   */
  public changeStatus(newStatus: ProductStatus): void {
    this.props.status = newStatus;
    this.props.updatedAt = new Date();
  }

  /**
   * SKU 옵션 추가
   */
  public addVariant(variant: ProductVariant): void {
    this.props.variants.push(variant);
    this.props.updatedAt = new Date();
  }

  /**
   * 기본 정보 업데이트
   */
  public update(dto: UpdateProductDTO): void {
    if (dto.nameKo !== undefined) {
      if (!dto.nameKo.trim()) throw new DomainError('상품명(한글)은 필수입니다.');
      this.props.nameKo = dto.nameKo.trim();
    }
    if (dto.nameEn !== undefined) this.props.nameEn = dto.nameEn;
    if (dto.categoryId !== undefined) this.props.categoryId = dto.categoryId;
    if (dto.discount !== undefined) this.props.discount = dto.discount;
    if (dto.taxType !== undefined) this.props.taxType = dto.taxType;
    if (dto.maxOrderQuantity !== undefined) this.props.maxOrderQuantity = dto.maxOrderQuantity;
    if (dto.manufacturer !== undefined) this.props.manufacturer = dto.manufacturer;
    if (dto.brandName !== undefined) this.props.brandName = dto.brandName;
    if (dto.description !== undefined) this.props.description = dto.description;
    if (dto.coverImageUrl !== undefined) this.props.coverImageUrl = dto.coverImageUrl;
    if (dto.additionalImages !== undefined) this.props.additionalImages = dto.additionalImages;
    if (dto.shippingFee !== undefined) this.props.shippingFee = dto.shippingFee;
    if (dto.originAddress !== undefined) this.props.originAddress = dto.originAddress;

    this.props.updatedAt = new Date();
  }

  public static create(
    props: Omit<ProductProps, 'createdAt' | 'updatedAt' | 'variants' | 'status'> & {
      status?: ProductStatus;
      variants?: ProductVariant[];
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: string
  ): Result<Product, DomainError> {
    if (!props.productCode || !props.productCode.trim()) {
      return fail(new DomainError('상품 코드는 필수 항목입니다.'));
    }
    if (!props.nameKo || !props.nameKo.trim()) {
      return fail(new DomainError('상품명(한글)은 필수 항목입니다.'));
    }
    if (props.maxOrderQuantity <= 0) {
      return fail(new DomainError('최대 주문 가능 수량은 1개 이상이어야 합니다.'));
    }

    const now = new Date();
    const status: ProductStatus =
      props.status ?? (props.stock.isOutOfStock() ? 'OUT_OF_STOCK' : 'ACTIVE');

    const product = new Product(
      {
        ...props,
        status,
        variants: props.variants ?? [],
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id
    );

    return ok(product);
  }
}
