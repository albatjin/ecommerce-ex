import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  IInquiryRepository,
  FindInquiriesFilter,
} from '@/core/domain/cs/repositories/IInquiryRepository';
import { Inquiry } from '@/core/domain/cs/entities/Inquiry';
import { getServerClient } from '../supabase/server';

// 메모리 캐시 (로컬 개발 및 Supabase RLS/마이그레이션 안전망)
const inquiryCache = new Map<string, Inquiry>();

export class SupabaseInquiryRepository implements IInquiryRepository {
  constructor(private supabaseClient?: SupabaseClient) {}

  private async getClient(): Promise<SupabaseClient> {
    if (this.supabaseClient) return this.supabaseClient;
    return await getServerClient();
  }

  public async findById(id: string): Promise<Inquiry | null> {
    if (inquiryCache.has(id)) {
      return inquiryCache.get(id)!;
    }

    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from('inquiries')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) {
        return inquiryCache.get(id) || null;
      }

      return this.toDomain(data);
    } catch {
      return inquiryCache.get(id) || null;
    }
  }

  public async findByCustomerId(customerId: string): Promise<Inquiry[]> {
    const cached = Array.from(inquiryCache.values())
      .filter((i) => i.customerId === customerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from('inquiries')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return cached;
      }

      return data.map((d: any) => this.toDomain(d));
    } catch {
      return cached;
    }
  }

  public async findMany(
    filter?: FindInquiriesFilter
  ): Promise<{ inquiries: Inquiry[]; totalCount: number }> {
    let all = Array.from(inquiryCache.values());

    if (filter?.customerId) {
      all = all.filter((i) => i.customerId === filter.customerId);
    }
    if (filter?.status) {
      all = all.filter((i) => i.status === filter.status);
    }
    if (filter?.category) {
      all = all.filter((i) => i.category === filter.category);
    }

    all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const offset = filter?.offset ?? 0;
    const limit = filter?.limit ?? 20;

    try {
      const supabase = await this.getClient();
      let query = supabase.from('inquiries').select('*', { count: 'exact' });

      if (filter?.customerId) query = query.eq('customer_id', filter.customerId);
      if (filter?.status) query = query.eq('status', filter.status);
      if (filter?.category) query = query.eq('category', filter.category);

      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;
      if (error || !data || data.length === 0) {
        return {
          inquiries: all.slice(offset, offset + limit),
          totalCount: all.length,
        };
      }

      return {
        inquiries: data.map((d: any) => this.toDomain(d)),
        totalCount: count ?? all.length,
      };
    } catch {
      return {
        inquiries: all.slice(offset, offset + limit),
        totalCount: all.length,
      };
    }
  }

  public async save(inquiry: Inquiry): Promise<void> {
    inquiryCache.set(inquiry.id, inquiry);

    try {
      const supabase = await this.getClient();
      await supabase.from('inquiries').upsert({
        id: inquiry.id,
        customer_id: inquiry.customerId,
        customer_name: inquiry.customerName,
        customer_email: inquiry.customerEmail,
        order_id: inquiry.orderId,
        category: inquiry.category,
        title: inquiry.title,
        content: inquiry.content,
        status: inquiry.status,
        answer: inquiry.answer,
        answered_at: inquiry.answeredAt?.toISOString(),
        created_at: inquiry.createdAt.toISOString(),
        updated_at: inquiry.updatedAt.toISOString(),
      });
    } catch {
      // safe fallback
    }
  }

  private toDomain(row: any): Inquiry {
    return Inquiry.create(
      {
        customerId: row.customer_id,
        customerName: row.customer_name || '고객',
        customerEmail: row.customer_email,
        orderId: row.order_id,
        category: row.category,
        title: row.title,
        content: row.content,
        status: row.status,
        answer: row.answer,
        answeredAt: row.answered_at ? new Date(row.answered_at) : null,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      },
      row.id
    ).getValue();
  }
}

