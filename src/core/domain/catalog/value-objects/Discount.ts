import { ValueObject } from '../../shared/ValueObject';
import { DomainError } from '../../shared/AppError';
import { Money } from './Money';

export interface DiscountProps {
  regularPrice: Money;
  salePrice: Money;
  discountRate: number;
}

/**
 * 정가, 판매가 및 할인율을 캡슐화하는 불변 값 객체
 */
export class Discount extends ValueObject<DiscountProps> {
  private constructor(props: DiscountProps) {
    super(props);
  }

  get regularPrice(): Money {
    return this.props.regularPrice;
  }

  get salePrice(): Money {
    return this.props.salePrice;
  }

  get discountRate(): number {
    return this.props.discountRate;
  }

  get discountAmount(): Money {
    return this.props.regularPrice.subtract(this.props.salePrice);
  }

  public hasDiscount(): boolean {
    return this.props.discountRate > 0;
  }

  public static create(regularPrice: Money, salePrice: Money): Discount {
    if (salePrice.isGreaterThan(regularPrice)) {
      throw new DomainError('판매가는 정가보다 클 수 없습니다.');
    }

    let discountRate = 0;
    if (regularPrice.amount > 0) {
      discountRate = Math.round(
        ((regularPrice.amount - salePrice.amount) / regularPrice.amount) * 100
      );
    }

    return new Discount({
      regularPrice,
      salePrice,
      discountRate,
    });
  }
}

