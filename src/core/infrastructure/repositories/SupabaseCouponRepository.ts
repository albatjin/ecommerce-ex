import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/shared/types/database.types';
import type { ICouponRepository } from '@/core/domain/promotion/repositories/ICouponRepository';
import type { CustomerCoupon } from '@/core/domain/promotion/entities/CustomerCoupon';
import { CouponMapper } from '../mappers/CouponMapper';
import { getServerClient } from '../supabase/server';
import { InternalError } from '@/core/domain/shared/AppError';

export class SupabaseCouponRepository implements ICouponRepository {
  private client?: SupabaseClient<Database>;

  constructor(client?: SupabaseClient<Database>) {
    this.client = client;
  }

  private async getClient(): Promise<SupabaseClient<Database>> {
    if (this.client) {
      return this.client;
    }
    return (await getServerClient()) as unknown as SupabaseClient<Database>;
  }

  public async findAvailableByCustomerId(customerId: string): Promise<CustomerCoupon[]> {
    const supabase = await this.getClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('customer_coupons')
      .select('*')
      .eq('customer_id', customerId)
      .eq('is_used', false)
      .gt('expires_at', now)
      .order('created_at', { ascending: false });

    if (error) {
      throw new InternalError(`사용 가능한 쿠폰 목록 조회 실패: ${error.message}`, error);
    }

    return (data || []).map((row) => CouponMapper.toDomain(row));
  }

  public async findAllByCustomerId(customerId: string): Promise<CustomerCoupon[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('customer_coupons')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new InternalError(`전체 쿠폰 목록 조회 실패: ${error.message}`, error);
    }

    return (data || []).map((row) => CouponMapper.toDomain(row));
  }

  public async findById(id: string): Promise<CustomerCoupon | null> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('customer_coupons')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new InternalError(`쿠폰 단건 조회 실패: ${error.message}`, error);
    }

    if (!data) return null;
    return CouponMapper.toDomain(data);
  }

  public async save(customerCoupon: CustomerCoupon): Promise<void> {
    const supabase = await this.getClient();
    const persistenceData = CouponMapper.toPersistence(customerCoupon);

    const { error } = await supabase
      .from('customer_coupons')
      .update({
        name: persistenceData.name,
        discount_amount: persistenceData.discount_amount,
        discount_rate: persistenceData.discount_rate,
        min_order_amount: persistenceData.min_order_amount,
        is_used: persistenceData.is_used,
        expires_at: persistenceData.expires_at,
      })
      .eq('id', customerCoupon.id);

    if (error) {
      throw new InternalError(`쿠폰 상태 갱신 실패: ${error.message}`, error);
    }
  }

  public async issueCoupon(customerCoupon: CustomerCoupon): Promise<void> {
    const supabase = await this.getClient();
    const persistenceData = CouponMapper.toPersistence(customerCoupon);

    const { error } = await supabase
      .from('customer_coupons')
      .insert(persistenceData);

    if (error) {
      throw new InternalError(`쿠폰 발급 저장 실패: ${error.message}`, error);
    }
  }
}

