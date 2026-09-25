import type {
  UserRole,
  MembershipGrade,
  UserStatus,
} from '@/shared/types/database.types';

export interface AdminUserSummaryDTO {
  id: string;
  customerNumber: string;
  email: string;
  name: string;
  phone?: string | null;
  role: UserRole;
  membershipGrade: MembershipGrade;
  status: UserStatus;
  totalSpent: number;
  totalOrders: number;
  rewardPoints: number;
  couponsCount: number;
  defaultAddress?: string | null;
  createdAt: string;
  lastVisitAt?: string | null;
}

export interface GetAdminUsersInputDTO {
  searchQuery?: string;
  role?: UserRole;
  membershipGrade?: MembershipGrade;
  status?: UserStatus;
  limit?: number;
  offset?: number;
}

export interface GetAdminUsersResultDTO {
  users: AdminUserSummaryDTO[];
  totalCount: number;
}

export interface UpdateUserStatusAndGradeInputDTO {
  userId: string;
  status?: UserStatus;
  membershipGrade?: MembershipGrade;
  role?: UserRole;
}

export interface GrantRewardPointsInputDTO {
  userId: string;
  amount: number;
  description: string;
}

export interface IssueManualCouponInputDTO {
  userId: string;
  name: string;
  discountAmount?: number | null;
  discountRate?: number | null;
  minOrderAmount?: number;
  validDays?: number;
}
