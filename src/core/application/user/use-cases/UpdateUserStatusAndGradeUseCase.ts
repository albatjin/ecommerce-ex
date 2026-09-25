import { Result, ok, fail } from '@/core/domain/shared/Result';
import { DomainError } from '@/core/domain/shared/AppError';
import type { IUserRepository } from '@/core/domain/user/IUserRepository';
import type {
  UpdateUserStatusAndGradeInputDTO,
  AdminUserSummaryDTO,
} from '../dto/admin-user.dto';

export class UpdateUserStatusAndGradeUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  public async execute(
    input: UpdateUserStatusAndGradeInputDTO
  ): Promise<Result<AdminUserSummaryDTO, DomainError>> {
    const user = await this.userRepo.findById(input.userId);
    if (!user) {
      return fail(new DomainError(`해당 회원(ID: ${input.userId})을 찾을 수 없습니다.`));
    }

    if (input.status) {
      user.changeStatus(input.status);
    }

    if (input.membershipGrade) {
      user.changeMembershipGrade(input.membershipGrade);
    }

    if (input.role) {
      user.changeRole(input.role);
    }

    await this.userRepo.update(user);

    return ok({
      id: user.id,
      customerNumber: user.customerNumber,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      membershipGrade: user.membershipGrade,
      status: user.status,
      totalSpent: user.totalSpent,
      totalOrders: user.totalOrders,
      rewardPoints: user.rewardPoints,
      couponsCount: user.couponsCount,
      defaultAddress: user.defaultAddress,
      createdAt: user.createdAt.toISOString(),
      lastVisitAt: user.lastVisitAt ? user.lastVisitAt.toISOString() : null,
    });
  }
}
