import { Result, ok, fail } from '@/core/domain/shared/Result';
import { DomainError } from '@/core/domain/shared/AppError';
import type { IUserRepository } from '@/core/domain/user/IUserRepository';
import type { IPointRepository } from '@/core/domain/promotion/repositories/IPointRepository';
import { PointTransaction } from '@/core/domain/promotion/entities/PointTransaction';
import type { GrantRewardPointsInputDTO } from '../dto/admin-user.dto';

export interface GrantUserPointsResultDTO {
  userId: string;
  amount: number;
  newBalance: number;
  description: string;
}

export class GrantUserPointsUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly pointRepo: IPointRepository
  ) {}

  public async execute(
    input: GrantRewardPointsInputDTO
  ): Promise<Result<GrantUserPointsResultDTO, DomainError>> {
    if (input.amount <= 0) {
      return fail(new DomainError('지급할 적립금은 0원보다 커야 합니다.'));
    }

    if (!input.description || !input.description.trim()) {
      return fail(new DomainError('적립금 지급 사유를 입력해 주세요.'));
    }

    const user = await this.userRepo.findById(input.userId);
    if (!user) {
      return fail(new DomainError(`해당 회원(ID: ${input.userId})을 찾을 수 없습니다.`));
    }

    user.addRewardPoints(input.amount);
    await this.userRepo.update(user);

    // 원장 기록 생성
    const transactionResult = PointTransaction.create({
      customerId: user.id,
      amount: input.amount,
      balanceAfter: user.rewardPoints,
      description: input.description.trim(),
    });

    if (transactionResult.isSuccess) {
      await this.pointRepo.recordTransaction(transactionResult.getValue());
    }

    return ok({
      userId: user.id,
      amount: input.amount,
      newBalance: user.rewardPoints,
      description: input.description.trim(),
    });
  }
}
