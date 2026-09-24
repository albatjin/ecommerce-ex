import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/shared/types/database.types';
import type {
  IOrderRepository,
  FindOrdersFilter,
} from '@/core/domain/order/repositories/IOrderRepository';
import type { Order } from '@/core/domain/order/entities/Order';
import { OrderNumber } from '@/core/domain/order/value-objects/OrderNumber';
import { OrderMapper } from '../mappers/OrderMapper';
import { getServerClient } from '../supabase/server';
import { InternalError } from '@/core/domain/shared/AppError';

type OrderRow = Database['public']['Tables']['orders']['Row'];
type OrderItemRow = Database['public']['Tables']['order_items']['Row'];

interface OrderWithItemsRow extends OrderRow {
  order_items: OrderItemRow[];
}

export class SupabaseOrderRepository implements IOrderRepository {
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

  public async findById(id: string): Promise<Order | null> {
    const supabase = await this.getClient();

    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new InternalError(`주문 ID 조회 실패: ${error.message}`, error);
    }

    if (!data) return null;

    const row = data as unknown as OrderWithItemsRow;
    return OrderMapper.toDomain(row, row.order_items || []);
  }

  public async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    const supabase = await this.getClient();

    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('order_number', orderNumber)
      .maybeSingle();

    if (error) {
      throw new InternalError(`주문번호 조회 실패: ${error.message}`, error);
    }

    if (!data) return null;

    const row = data as unknown as OrderWithItemsRow;
    return OrderMapper.toDomain(row, row.order_items || []);
  }

  public async findMany(
    filter: FindOrdersFilter
  ): Promise<{ orders: Order[]; totalCount: number }> {
    const supabase = await this.getClient();

    let query = supabase
      .from('orders')
      .select('*, order_items(*)', { count: 'exact' });

    if (filter.customerId) {
      query = query.eq('customer_id', filter.customerId);
    }
    if (filter.status) {
      query = query.eq('status', filter.status);
    }

    const limit = filter.limit ?? 20;
    const offset = filter.offset ?? 0;

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new InternalError(`주문 목록 조회 실패: ${error.message}`, error);
    }

    const rows = (data || []) as unknown as OrderWithItemsRow[];
    const orders = rows.map((r) => OrderMapper.toDomain(r, r.order_items || []));

    return {
      orders,
      totalCount: count ?? orders.length,
    };
  }

  public async save(order: Order): Promise<void> {
    const supabase = await this.getClient();

    const orderData = OrderMapper.toOrderPersistence(order);
    const itemDataList = OrderMapper.toItemPersistenceList(order.id, order.items);

    // 1. orders 테이블 upsert
    const { error: orderError } = await supabase
      .from('orders')
      .upsert(orderData);

    if (orderError) {
      throw new InternalError(`주문 저장 실패: ${orderError.message}`, orderError);
    }

    // 2. order_items 테이블 upsert
    if (itemDataList.length > 0) {
      const { error: itemsError } = await supabase
        .from('order_items')
        .upsert(itemDataList);

      if (itemsError) {
        throw new InternalError(`주문 품목 저장 실패: ${itemsError.message}`, itemsError);
      }
    }
  }

  public async nextOrderNumber(): Promise<OrderNumber> {
    const supabase = await this.getClient();

    // 중복 방지를 위한 고유 번호 생성 루프
    for (let attempts = 0; attempts < 5; attempts++) {
      const generated = OrderNumber.generate();
      const { data } = await supabase
        .from('orders')
        .select('id')
        .eq('order_number', generated.value)
        .maybeSingle();

      if (!data) {
        return generated;
      }
    }

    // fallback: 타임스탬프 밀리초 기반 보장
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const millis = now.getTime().toString().slice(-5);
    return OrderNumber.create(`ORD-${dateStr}-${millis}`).getValue();
  }
}
