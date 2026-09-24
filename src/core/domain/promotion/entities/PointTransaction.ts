import { Entity } from '../../shared/Entity';
import { Result, ok, fail } from '../../shared/Result';
import { DomainError } from '../../shared/AppError';

export interface PointTransactionProps {
  customerId: string;
  orderId?: string | null;
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: Date;
}

/**
 * 적립금 거래 내역 도메인 엔티티 (불변 원장 기록)
 */
export class PointTransaction extends Entity<PointTransactionProps> {
  private constructor(props: PointTransactionProps, id?: string) {
    super(props, id);
  }

  get customerId(): string { return this.props.customerId; }
  get orderId(): string | null | undefined { return this.props.orderId; }
  get amount(): number { return this.props.amount; }
  get balanceAfter(): number { return this.props.balanceAfter; }
  get description(): string { return this.props.description; }
  get createdAt(): Date { return this.props.createdAt; }

  public isEarn(): boolean {
    return this.props.amount > 0;
  }

  public isSpend(): boolean {
    return this.props.amount < 0;
  }

  public static create(
    props: Omit<PointTransactionProps, 'createdAt'> & { createdAt?: Date },
    id?: string
  ): Result<PointTransaction, DomainError> {
    if (!props.customerId || !props.customerId.trim()) {
      return fail(new DomainError('고객 ID는 필수입니다.'));
    }
    if (props.amount === 0) {
      return fail(new DomainError('거래 포인트 금액은 0일 수 없습니다.'));
    }
    if (props.balanceAfter < 0) {
      return fail(new DomainError('거래 후 잔여 포인트는 음수일 수 없습니다.'));
    }
    if (!props.description || !props.description.trim()) {
      return fail(new DomainError('적립금 내역 설명은 필수입니다.'));
    }

    const transaction = new PointTransaction(
      {
        ...props,
        orderId: props.orderId ?? null,
        createdAt: props.createdAt ?? new Date(),
      },
      id
    );

    return ok(transaction);
  }

  /**
   * 신규 적립 팩토리
   */
  public static createEarn(params: {
    customerId: string;
    amount: number;
    currentBalance: number;
    description: string;
    orderId?: string | null;
  }): Result<PointTransaction, DomainError> {
    if (params.amount <= 0) {
      return fail(new DomainError('적립 금액은 0보다 커야 합니다.'));
    }

    return PointTransaction.create({
      customerId: params.customerId,
      orderId: params.orderId ?? null,
      amount: params.amount,
      balanceAfter: params.currentBalance + params.amount,
      description: params.description,
    });
  }

  /**
   * 사용(차감) 팩토리
   */
  public static createSpend(params: {
    customerId: string;
    amount: number;
    currentBalance: number;
    description: string;
    orderId?: string | null;
  }): Result<PointTransaction, DomainError> {
    if (params.amount <= 0) {
      return fail(new DomainError('사용 차감 금액은 0보다 커야 합니다.'));
    }
    if (params.currentBalance < params.amount) {
      return fail(
        new DomainError(
          `보유 포인트(${params.currentBalance.toLocaleString()}P)가 부족하여 ${params.amount.toLocaleString()}P를 사용할 수 없습니다.`
        )
      );
    }

    return PointTransaction.create({
      customerId: params.customerId,
      orderId: params.orderId ?? null,
      amount: -params.amount,
      balanceAfter: params.currentBalance - params.amount,
      description: params.description,
    });
  }
}
