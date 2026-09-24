import { User } from '@/core/domain/user/User';
import type { Database } from '@/shared/types/database.types';

type UserRow = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];
type UserUpdate = Database['public']['Tables']['users']['Update'];

/**
 * DB Row ↔ Domain Entity 매퍼
 */
export class UserMapper {
  /**
   * Supabase DB Row를 Domain User 엔티티로 변환
   */
  public static toDomain(row: UserRow): User {
    const userResult = User.create(
      {
        customerNumber: row.customer_number || '',
        email: row.email,
        name: row.name,
        phone: row.phone,
        role: row.role,
        avatarUrl: row.avatar_url,
        membershipGrade: row.membership_grade,
        status: row.status,
        totalSpent: Number(row.total_spent),
        totalOrders: row.total_orders,
        rewardPoints: row.reward_points,
        couponsCount: row.coupons_count,
        personalCustomsCode: row.personal_customs_code,
        gender: row.gender,
        birthYear: row.birth_year,
        smsConsent: row.sms_consent,
        emailConsent: row.email_consent,
        appPushConsent: row.app_push_consent,
        defaultAddress: row.default_address,
        defaultZipcode: row.default_zipcode,
        lastVisitAt: row.last_visit_at ? new Date(row.last_visit_at) : null,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      },
      row.id
    );

    if (userResult.isFailure) {
      throw new Error(`Failed to map UserRow to Domain: ${userResult.getError().message}`);
    }

    return userResult.getValue();
  }

  /**
   * Domain User 엔티티를 DB Insert 데이터로 변환
   */
  public static toPersistence(user: User): UserInsert {
    return {
      id: user.id,
      customer_number: user.customerNumber,
      email: user.email,
      name: user.name,
      phone: user.phone ?? null,
      role: user.role,
      avatar_url: user.avatarUrl ?? null,
      membership_grade: user.membershipGrade,
      status: user.status,
      total_spent: user.totalSpent,
      total_orders: user.totalOrders,
      reward_points: user.rewardPoints,
      coupons_count: user.couponsCount,
      personal_customs_code: user.personalCustomsCode ?? null,
      gender: user.gender ?? null,
      birth_year: user.birthYear ?? null,
      sms_consent: user.smsConsent,
      email_consent: user.emailConsent,
      app_push_consent: user.appPushConsent,
      default_address: user.defaultAddress ?? null,
      default_zipcode: user.defaultZipcode ?? null,
      last_visit_at: user.lastVisitAt ? user.lastVisitAt.toISOString() : null,
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString(),
    };
  }

  /**
   * Domain User 엔티티를 DB Update 데이터로 변환
   */
  public static toUpdatePersistence(user: User): UserUpdate {
    return {
      customer_number: user.customerNumber,
      email: user.email,
      name: user.name,
      phone: user.phone ?? null,
      role: user.role,
      avatar_url: user.avatarUrl ?? null,
      membership_grade: user.membershipGrade,
      status: user.status,
      total_spent: user.totalSpent,
      total_orders: user.totalOrders,
      reward_points: user.rewardPoints,
      coupons_count: user.couponsCount,
      personal_customs_code: user.personalCustomsCode ?? null,
      gender: user.gender ?? null,
      birth_year: user.birthYear ?? null,
      sms_consent: user.smsConsent,
      email_consent: user.emailConsent,
      app_push_consent: user.appPushConsent,
      default_address: user.defaultAddress ?? null,
      default_zipcode: user.defaultZipcode ?? null,
      last_visit_at: user.lastVisitAt ? user.lastVisitAt.toISOString() : null,
      updated_at: user.updatedAt.toISOString(),
    };
  }
}

