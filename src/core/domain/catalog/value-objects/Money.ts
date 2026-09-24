import { ValueObject } from '../../shared/ValueObject';
import { DomainError } from '../../shared/AppError';

export interface MoneyProps {
  amount: number;
  currency: string;
}

/**
 * 금액 및 화폐 단위를 다루는 불변 값 객체 (Value Object)
 */
export class Money extends ValueObject<MoneyProps> {
  private constructor(props: MoneyProps) {
    super(props);
  }

  get amount(): number {
    return this.props.amount;
  }

  get currency(): string {
    return this.props.currency;
  }

  public static create(amount: number, currency = 'KRW'): Money {
    if (isNaN(amount)) {
      throw new DomainError('금액은 유효한 숫자여야 합니다.');
    }
    if (amount < 0) {
      throw new DomainError('금액은 음수일 수 없습니다.');
    }
    return new Money({ amount: Math.round(amount), currency });
  }

  public static zero(currency = 'KRW'): Money {
    return new Money({ amount: 0, currency });
  }

  public add(other: Money): Money {
    this.assertSameCurrency(other);
    return Money.create(this.amount + other.amount, this.currency);
  }

  public subtract(other: Money): Money {
    this.assertSameCurrency(other);
    if (this.amount < other.amount) {
      throw new DomainError('차감할 금액이 보유 금액보다 클 수 없습니다.');
    }
    return Money.create(this.amount - other.amount, this.currency);
  }

  public multiply(factor: number): Money {
    if (factor < 0) {
      throw new DomainError('배수는 음수일 수 없습니다.');
    }
    return Money.create(Math.round(this.amount * factor), this.currency);
  }

  public isGreaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amount > other.amount;
  }

  public isGreaterThanOrEqual(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amount >= other.amount;
  }

  /**
   * 한국어 화폐 포맷 (예: "35,000원")
   */
  public format(): string {
    if (this.currency === 'KRW') {
      return `${this.amount.toLocaleString()}원`;
    }
    return `${this.amount.toLocaleString()} ${this.currency}`;
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new DomainError(`화폐 단위가 일치하지 않습니다 (${this.currency} vs ${other.currency}).`);
    }
  }
}

