import { ValueObject } from '../../shared/ValueObject';
import { Result, ok, fail } from '../../shared/Result';
import { DomainError } from '../../shared/AppError';

export interface ShippingAddressProps {
  recipientName: string;
  recipientPhone: string;
  address: string;
  zipcode: string;
  message?: string | null;
}

/**
 * 주문 배송지 정보 Value Object (불변 객체)
 */
export class ShippingAddress extends ValueObject<ShippingAddressProps> {
  private constructor(props: ShippingAddressProps) {
    super(props);
  }

  get recipientName(): string { return this.props.recipientName; }
  get recipientPhone(): string { return this.props.recipientPhone; }
  get address(): string { return this.props.address; }
  get zipcode(): string { return this.props.zipcode; }
  get message(): string | null | undefined { return this.props.message; }

  public static create(props: ShippingAddressProps): Result<ShippingAddress, DomainError> {
    if (!props.recipientName || !props.recipientName.trim()) {
      return fail(new DomainError('수령인 이름은 필수입니다.'));
    }
    if (!props.recipientPhone || !props.recipientPhone.trim()) {
      return fail(new DomainError('수령인 연락처는 필수입니다.'));
    }
    // 간단한 한국 연락처 형식 검증 (하이픈 유무 무관 9~12자리)
    const cleanedPhone = props.recipientPhone.replace(/[^0-9]/g, '');
    if (cleanedPhone.length < 9 || cleanedPhone.length > 12) {
      return fail(new DomainError('올바른 전화번호 형식을 입력해 주세요.'));
    }
    if (!props.address || !props.address.trim()) {
      return fail(new DomainError('배송지 주소는 필수입니다.'));
    }
    if (!props.zipcode || !props.zipcode.trim()) {
      return fail(new DomainError('우편번호는 필수입니다.'));
    }

    return ok(
      new ShippingAddress({
        recipientName: props.recipientName.trim(),
        recipientPhone: props.recipientPhone.trim(),
        address: props.address.trim(),
        zipcode: props.zipcode.trim(),
        message: props.message?.trim() || null,
      })
    );
  }
}

