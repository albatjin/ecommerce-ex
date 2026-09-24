import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/shared/types/database.types';
import type { IPointRepository } from '@/core/domain/promotion/repositories/IPointRepository';
import type { PointTransaction } from '@/core/domain/promotion/entities/PointTransaction';
import { PointMapper } from '../mappers/PointMapper';
import { getServerClient } from '../supabase/server';
import { InternalError } from '@/core/domain/shared/AppError';

export class SupabasePointRepository implements IPointRepository {
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

  public async findByCustomerId(customerId: string, limit = 20): Promise<PointTransaction[]> {
    const supabase = await this.getClient();

    const { data, error } = await supabase
      .from('point_transactions')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new InternalError(`적립금 거래 내역 조회 실패: ${error.message}`, error);
    }

    return (data || []).map((row) => PointMapper.toDomain(row));
  }

  public async getCurrentBalance(customerId: string): Promise<number> {
    const supabase = await this.getClient();

    const { data, error } = await supabase
      .from('users')
      .select('reward_points')
      .eq('id', customerId)
      .maybeSingle();

    if (error) {
      throw new InternalError(`현재 적립금 잔액 조회 실패: ${error.message}`, error);
    }

    return Number(data?.reward_points || 0);
  }

  public async recordTransaction(transaction: PointTransaction): Promise<void> {
    const supabase = await this.getClient();
    const persistenceData = PointMapper.toPersistence(transaction);

    // 1. 거래 내역 원장 기록
    const { error: txError } = await supabase
      .from('point_transactions')
      .insert(persistenceData);

    if (txError) {
      throw new InternalError(`적립금 내역 저장 실패: ${txError.message}`, txError);
    }

    // 2. 회원 테이블의 현재 적립금 잔액 동기화
    const { error: userError } = await supabase
      .from('users')
      .update({
        reward_points: transaction.balanceAfter,
        updated_at: new Date().toISOString(),
      })
      .eq('id', transaction.customerId);

    if (userError) {
      throw new InternalError(`회원 적립금 잔액 갱신 실패: ${userError.message}`, userError);
    }
  }
}
