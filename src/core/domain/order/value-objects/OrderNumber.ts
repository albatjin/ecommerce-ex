import { ValueObject } from '../../shared/ValueObject';
import { Result, ok, fail } from '../../shared/Result';
import { DomainError } from '../../shared/AppError';

export interface OrderNumberProps {
  value: string;
}

/**
 * 주문 번호 Value Object (e.g. ORD-20260924-A1B2C)
 */
export class OrderNumber extends ValueObject<OrderNumberProps> {
  private constructor(props: OrderNumberProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  public static create(value: string): Result<OrderNumber, DomainError> {
    if (!value || !value.trim()) {
      return fail(new DomainError('주문 번호는 비어 있을 수 없습니다.'));
    }

    const trimmed = value.trim().toUpperCase();
    if (!/^ORD-\d{8}-[A-Z0-9]{4,8}$/.test(trimmed)) {
      // 일반 주문 번호 패턴 검증
      if (trimmed.length < 8) {
        return fail(new DomainError('주문 번호 형식이 올바르지 않습니다.'));
      }
    }

    return ok(new OrderNumber({ value: trimmed }));
  }

  /**
   * 신규 주문 번호 생성 헬퍼
   */
  public static generate(): OrderNumber {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
    return new OrderNumber({ value: `ORD-${dateStr}-${randomHex}` });
  }
}

