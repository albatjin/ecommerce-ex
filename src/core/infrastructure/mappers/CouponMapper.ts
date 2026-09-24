import { CustomerCoupon } from '@/core/domain/promotion/entities/CustomerCoupon';
import type { Database } from '@/shared/types/database.types';

type CustomerCouponRow = Database['public']['Tables']['customer_coupons']['Row'];
type CustomerCouponInsert = Database['public']['Tables']['customer_coupons']['Insert'];

export class CouponMapper {
  public static toDomain(row: CustomerCouponRow): CustomerCoupon {
    const result = CustomerCoupon.create(
      {
        customerId: row.customer_id,
        name: row.name,
        discountAmount: row.discount_amount ? Number(row.discount_amount) : null,
        discountRate: row.discount_rate ? Number(row.discount_rate) : null,
        minOrderAmount: Number(row.min_order_amount || 0),
        isUsed: row.is_used,
        expiresAt: new Date(row.expires_at),
        createdAt: new Date(row.created_at),
      },
      row.id
    );

    if (result.isFailure) {
      throw new Error(`Failed to map CustomerCouponRow to Domain: ${result.getError().message}`);
    }

    return result.getValue();
  }

  public static toPersistence(coupon: CustomerCoupon): CustomerCouponInsert {
    return {
      id: coupon.id,
      customer_id: coupon.customerId,
      name: coupon.name,
      discount_amount: coupon.discountAmount ?? null,
      discount_rate: coupon.discountRate ?? null,
      min_order_amount: coupon.minOrderAmount,
      is_used: coupon.isUsed,
      expires_at: coupon.expiresAt.toISOString(),
      created_at: coupon.createdAt.toISOString(),
    };
  }
}

