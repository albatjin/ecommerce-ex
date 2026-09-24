import type { User } from './User';
import type { UserRole, MembershipGrade, UserStatus } from '@/shared/types/database.types';

export interface UserFilterOptions {
  role?: UserRole;
  membershipGrade?: MembershipGrade;
  status?: UserStatus;
  searchQuery?: string;
  limit?: number;
  offset?: number;
}

/**
 * User 리포지토리 인터페이스 (도메인 추상화 계층)
 */
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByCustomerNumber(customerNumber: string): Promise<User | null>;
  findMany(options?: UserFilterOptions): Promise<{ users: User[]; totalCount: number }>;
  save(user: User): Promise<void>;
  update(user: User): Promise<void>;
  delete(id: string): Promise<void>;
}

