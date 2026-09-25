import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/shared/types/database.types';
import type { ICategoryRepository } from '@/core/domain/catalog/repositories/ICategoryRepository';
import type { Category } from '@/core/domain/catalog/entities/Category';
import { CategoryMapper } from '../mappers/CategoryMapper';
import { getServerClient } from '../supabase/server';
import { InternalError } from '@/core/domain/shared/AppError';

export class SupabaseCategoryRepository implements ICategoryRepository {
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

  public async findById(id: string): Promise<Category | null> {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(id)) {
      return this.findBySlug(id);
    }

    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new InternalError(`Failed to fetch category by id: ${error.message}`, error);
    }

    if (!data) return null;
    return CategoryMapper.toDomain(data);
  }

  public async findBySlug(slug: string): Promise<Category | null> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      throw new InternalError(`Failed to fetch category by slug: ${error.message}`, error);
    }

    if (!data) return null;
    return CategoryMapper.toDomain(data);
  }

  public async findAllActive(): Promise<Category[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      throw new InternalError(`Failed to fetch active categories: ${error.message}`, error);
    }

    return (data || []).map((row) => CategoryMapper.toDomain(row));
  }

  public async findAll(): Promise<Category[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      throw new InternalError(`Failed to fetch all categories: ${error.message}`, error);
    }

    return (data || []).map((row) => CategoryMapper.toDomain(row));
  }

  public async findByParentId(parentId: string | null): Promise<Category[]> {
    const supabase = await this.getClient();
    let query = supabase.from('categories').select('*').eq('is_active', true);

    if (parentId === null) {
      query = query.is('parent_id', null);
    } else {
      query = query.eq('parent_id', parentId);
    }

    const { data, error } = await query.order('sort_order', { ascending: true });

    if (error) {
      throw new InternalError(`Failed to fetch categories by parentId: ${error.message}`, error);
    }

    return (data || []).map((row) => CategoryMapper.toDomain(row));
  }

  public async save(category: Category): Promise<void> {
    const supabase = await this.getClient();
    const { error } = await supabase
      .from('categories')
      .insert(CategoryMapper.toPersistence(category));

    if (error) {
      throw new InternalError(`Failed to save category: ${error.message}`, error);
    }
  }

  public async update(category: Category): Promise<void> {
    const supabase = await this.getClient();
    const { error } = await supabase
      .from('categories')
      .update(CategoryMapper.toUpdatePersistence(category))
      .eq('id', category.id);

    if (error) {
      throw new InternalError(`Failed to update category: ${error.message}`, error);
    }
  }

  public async delete(id: string): Promise<void> {
    const supabase = await this.getClient();
    const { error } = await supabase.from('categories').delete().eq('id', id);

    if (error) {
      throw new InternalError(`Failed to delete category: ${error.message}`, error);
    }
  }
}

