import { Result, ok, fail } from '@/core/domain/shared/Result';
import { DomainError } from '@/core/domain/shared/AppError';
import type { IUserRepository } from '@/core/domain/user/IUserRepository';
import type { ICouponRepository } from '@/core/domain/promotion/repositories/ICouponRepository';
import { CustomerCoupon } from '@/core/domain/promotion/entities/CustomerCoupon';
import type { IssueManualCouponInputDTO } from '../dto/admin-user.dto';

export interface IssueUserCouponResultDTO {
  couponId: string;
  userId: string;
  name: string;
  discountSummary: string;
  expiresAt: string;
}

export class IssueUserCouponUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly couponRepo: ICouponRepository
  ) {}

  public async execute(
    input: IssueManualCouponInputDTO
  ): Promise<Result<IssueUserCouponResultDTO, DomainError>> {
    if (!input.name || !input.name.trim()) {
      return fail(new DomainError('쿠폰명을 입력해 주세요.'));
    }

    if (!input.discountAmount && !input.discountRate) {
      return fail(new DomainError('정액 할인 금액 또는 정률 할인율 중 하나를 지정해야 합니다.'));
    }

    if (input.discountRate && (input.discountRate <= 0 || input.discountRate > 100)) {
      return fail(new DomainError('할인율은 1% 이상 100% 이하여야 합니다.'));
    }

    if (input.discountAmount && input.discountAmount <= 0) {
      return fail(new DomainError('할인 금액은 0원보다 커야 합니다.'));
    }

    const user = await this.userRepo.findById(input.userId);
    if (!user) {
      return fail(new DomainError(`해당 회원(ID: ${input.userId})을 찾을 수 없습니다.`));
    }

    const validDays = input.validDays ?? 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validDays);

    const couponResult = CustomerCoupon.create({
      customerId: user.id,
      name: input.name.trim(),
      discountAmount: input.discountAmount ?? null,
      discountRate: input.discountRate ?? null,
      minOrderAmount: input.minOrderAmount ?? 0,
      isUsed: false,
      expiresAt,
    });

    if (couponResult.isFailure) {
      return fail(couponResult.getError());
    }

    const coupon = couponResult.getValue();
    await this.couponRepo.issueCoupon(coupon);

    const discountSummary = input.discountRate
      ? `${input.discountRate}% 할인`
      : `${input.discountAmount?.toLocaleString()}원 할인`;

    return ok({
      couponId: coupon.id,
      userId: user.id,
      name: coupon.name,
      discountSummary,
      expiresAt: coupon.expiresAt.toISOString(),
    });
  }
}
