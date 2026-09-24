import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/shared/types/database.types';
import type {
  IProductRepository,
  ProductFilterOptions,
} from '@/core/domain/catalog/repositories/IProductRepository';
import type { Product } from '@/core/domain/catalog/entities/Product';
import { ProductMapper } from '../mappers/ProductMapper';
import { getServerClient } from '../supabase/server';
import { InternalError } from '@/core/domain/shared/AppError';

export class SupabaseProductRepository implements IProductRepository {
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

  public async findById(id: string): Promise<Product | null> {
    const supabase = await this.getClient();

    const { data: productRow, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (productError) {
      throw new InternalError(`Failed to fetch product by id: ${productError.message}`, productError);
    }

    if (!productRow) return null;

    const { data: variantRows, error: variantError } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', id);

    if (variantError) {
      throw new InternalError(
        `Failed to fetch variants for product ${id}: ${variantError.message}`,
        variantError
      );
    }

    return ProductMapper.toDomain(productRow, variantRows || []);
  }

  public async findByProductCode(productCode: string): Promise<Product | null> {
    const supabase = await this.getClient();

    const { data: productRow, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('product_code', productCode)
      .maybeSingle();

    if (productError) {
      throw new InternalError(
        `Failed to fetch product by code: ${productError.message}`,
        productError
      );
    }

    if (!productRow) return null;

    const { data: variantRows, error: variantError } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', productRow.id);

    if (variantError) {
      throw new InternalError(
        `Failed to fetch variants for product ${productRow.id}: ${variantError.message}`,
        variantError
      );
    }

    return ProductMapper.toDomain(productRow, variantRows || []);
  }

  public async findMany(
    options: ProductFilterOptions = {}
  ): Promise<{ products: Product[]; totalCount: number }> {
    const supabase = await this.getClient();

    let query = supabase.from('products').select('*', { count: 'exact' });

    if (options.categoryId) {
      query = query.eq('category_id', options.categoryId);
    }

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.searchQuery && options.searchQuery.trim()) {
      const sanitized = options.searchQuery.trim();
      query = query.or(`name_ko.ilike.%${sanitized}%,description.ilike.%${sanitized}%`);
    }

    if (options.minPrice !== undefined) {
      query = query.gte('sale_price', options.minPrice);
    }

    if (options.maxPrice !== undefined) {
      query = query.lte('sale_price', options.maxPrice);
    }

    if (options.hasDiscount) {
      query = query.gt('discount_rate', 0);
    }

    // 정렬
    switch (options.sortBy) {
      case 'price_asc':
        query = query.order('sale_price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('sale_price', { ascending: false });
        break;
      case 'popular':
        query = query.order('stock_quantity', { ascending: false });
        break;
      case 'created_at':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    // 페이지네이션
    const limit = options.limit ?? 20;
    const offset = options.offset ?? 0;
    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      throw new InternalError(`Failed to fetch products: ${error.message}`, error);
    }

    const products = (data || []).map((row) => ProductMapper.toDomain(row, []));

    return {
      products,
      totalCount: count ?? 0,
    };
  }

  public async save(product: Product): Promise<void> {
    const supabase = await this.getClient();

    const { error: productError } = await supabase
      .from('products')
      .insert(ProductMapper.toPersistence(product));

    if (productError) {
      throw new InternalError(`Failed to save product: ${productError.message}`, productError);
    }

    if (product.variants.length > 0) {
      const variantInserts = product.variants.map((v) => ProductMapper.variantToPersistence(v));
      const { error: variantError } = await supabase
        .from('product_variants')
        .insert(variantInserts);

      if (variantError) {
        throw new InternalError(
          `Failed to save product variants: ${variantError.message}`,
          variantError
        );
      }
    }
  }

  public async update(product: Product): Promise<void> {
    const supabase = await this.getClient();

    const { error } = await supabase
      .from('products')
      .update(ProductMapper.toUpdatePersistence(product))
      .eq('id', product.id);

    if (error) {
      throw new InternalError(`Failed to update product: ${error.message}`, error);
    }
  }

  public async delete(id: string): Promise<void> {
    const supabase = await this.getClient();
    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) {
      throw new InternalError(`Failed to delete product: ${error.message}`, error);
    }
  }
}

