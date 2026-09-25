import { Result, ok } from '@/core/domain/shared/Result';
import { DomainError } from '@/core/domain/shared/AppError';
import type { IUserRepository } from '@/core/domain/user/IUserRepository';
import type {
  GetAdminUsersInputDTO,
  GetAdminUsersResultDTO,
  AdminUserSummaryDTO,
} from '../dto/admin-user.dto';

export class GetAdminUsersUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  public async execute(
    input: GetAdminUsersInputDTO = {}
  ): Promise<Result<GetAdminUsersResultDTO, DomainError>> {
    const { users, totalCount } = await this.userRepo.findMany({
      searchQuery: input.searchQuery,
      role: input.role,
      membershipGrade: input.membershipGrade,
      status: input.status,
      limit: input.limit ?? 50,
      offset: input.offset ?? 0,
    });

    const dtoList: AdminUserSummaryDTO[] = users.map((u) => ({
      id: u.id,
      customerNumber: u.customerNumber,
      email: u.email,
      name: u.name,
      phone: u.phone,
      role: u.role,
      membershipGrade: u.membershipGrade,
      status: u.status,
      totalSpent: u.totalSpent,
      totalOrders: u.totalOrders,
      rewardPoints: u.rewardPoints,
      couponsCount: u.couponsCount,
      defaultAddress: u.defaultAddress,
      createdAt: u.createdAt.toISOString(),
      lastVisitAt: u.lastVisitAt ? u.lastVisitAt.toISOString() : null,
    }));

    return ok({
      users: dtoList,
      totalCount,
    });
  }
}
