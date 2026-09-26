import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/shared/types/database.types';
import type {
  IProductRepository,
  ProductFilterOptions,
} from '@/core/domain/catalog/repositories/IProductRepository';
import { Product } from '@/core/domain/catalog/entities/Product';
import { ProductVariant } from '@/core/domain/catalog/entities/ProductVariant';
import { Money } from '@/core/domain/catalog/value-objects/Money';
import { Stock } from '@/core/domain/catalog/value-objects/Stock';
import { Discount } from '@/core/domain/catalog/value-objects/Discount';
import { ProductMapper } from '../mappers/ProductMapper';
import { getServerClient } from '../supabase/server';
import { InternalError } from '@/core/domain/shared/AppError';
import { MOCK_PRODUCTS } from '@/shared/data/mockProducts';
import { findDefaultCategoryByIdOrSlug } from '@/shared/data/defaultCategories';

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

  private findFromMock(idOrCode: string, byCode = false): Product | null {
    const mock = MOCK_PRODUCTS.find((p) =>
      byCode ? p.productCode === idOrCode : p.id === idOrCode
    );
    if (!mock) return null;

    const variants = (mock.variants || [])
      .map((v) => {
        const vResult = ProductVariant.create(
          {
            productId: mock.id,
            skuCode: v.skuCode,
            variantName: v.variantName,
            options: v.options,
            additionalPrice: Money.create(v.additionalPrice),
            stock: Stock.create(v.stockQuantity),
            status: v.status,
          },
          v.id
        );
        return vResult.isSuccess ? vResult.getValue() : null;
      })
      .filter((v): v is ProductVariant => v !== null);

    const productResult = Product.create(
      {
        productCode: mock.productCode,
        nameKo: mock.nameKo,
        nameEn: mock.nameEn,
        categoryId: mock.categoryId,
        discount: Discount.create(
          Money.create(mock.regularPrice),
          Money.create(mock.salePrice)
        ),
        taxType: mock.taxType,
        maxOrderQuantity: 10,
        stock: Stock.create(mock.stockQuantity),
        status: mock.status,
        brandName: mock.brandName,
        description: mock.description,
        coverImageUrl: mock.coverImageUrl,
        additionalImages: mock.additionalImages || [],
        shippingFee: Money.create(mock.shippingFee || 0),
        variants,
      },
      mock.id
    );

    return productResult.isSuccess ? productResult.getValue() : null;
  }

  public async findById(id: string): Promise<Product | null> {
    if (id.startsWith('sample-')) {
      return this.findFromMock(id);
    }

    const supabase = await this.getClient();

    const { data: productRow, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (productError) {
      if (productError.message.includes('uuid')) {
        return this.findFromMock(id);
      }
      throw new InternalError(`Failed to fetch product by id: ${productError.message}`, productError);
    }

    if (!productRow) {
      return this.findFromMock(id);
    }

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
      const mock = this.findFromMock(productCode, true);
      if (mock) return mock;
      throw new InternalError(
        `Failed to fetch product by code: ${productError.message}`,
        productError
      );
    }

    if (!productRow) {
      return this.findFromMock(productCode, true);
    }

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
    if (product.id.startsWith('sample-')) {
      return;
    }

    const supabase = await this.getClient();
    let insertData = ProductMapper.toPersistence(product);

    // 카테고리 ID가 존재할 경우 DB 참조 정합성 검증 및 기본 카테고리 자동 동기화
    if (insertData.category_id) {
      const { data: catExists } = await supabase
        .from('categories')
        .select('id')
        .eq('id', insertData.category_id)
        .maybeSingle();

      if (!catExists) {
        const defaultCat = findDefaultCategoryByIdOrSlug(insertData.category_id);
        if (defaultCat) {
          const { error: catInsertErr } = await supabase.from('categories').upsert({
            id: defaultCat.id,
            name: defaultCat.name,
            slug: defaultCat.slug,
            depth: defaultCat.depth,
            sort_order: defaultCat.sortOrder,
            is_active: true,
          });
          if (catInsertErr) {
            insertData = { ...insertData, category_id: null };
          }
        } else {
          insertData = { ...insertData, category_id: null };
        }
      }
    }

    let { error: productError } = await supabase
      .from('products')
      .insert(insertData);

    // 외래 키 제약 오류 발생 시 안전하게 category_id=null로 2차 시도
    if (
      productError &&
      (productError.message.includes('category') ||
        productError.message.includes('foreign key') ||
        productError.message.includes('fkey'))
    ) {
      const retryResult = await supabase
        .from('products')
        .insert({ ...insertData, category_id: null });
      productError = retryResult.error;
    }

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
    if (product.id.startsWith('sample-')) {
      const mock = MOCK_PRODUCTS.find((p) => p.id === product.id);
      if (mock) {
        mock.stockQuantity = product.stock.quantity;
        mock.status = product.status;
      }
      return;
    }

    const supabase = await this.getClient();
    let updateData = ProductMapper.toUpdatePersistence(product);

    if (updateData.category_id) {
      const { data: catExists } = await supabase
        .from('categories')
        .select('id')
        .eq('id', updateData.category_id)
        .maybeSingle();

      if (!catExists) {
        const defaultCat = findDefaultCategoryByIdOrSlug(updateData.category_id);
        if (defaultCat) {
          const { error: catInsertErr } = await supabase.from('categories').upsert({
            id: defaultCat.id,
            name: defaultCat.name,
            slug: defaultCat.slug,
            depth: defaultCat.depth,
            sort_order: defaultCat.sortOrder,
            is_active: true,
          });
          if (catInsertErr) {
            updateData = { ...updateData, category_id: null };
          }
        } else {
          updateData = { ...updateData, category_id: null };
        }
      }
    }

    let { error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', product.id);

    if (
      error &&
      (error.message.includes('category') ||
        error.message.includes('foreign key') ||
        error.message.includes('fkey'))
    ) {
      const retryResult = await supabase
        .from('products')
        .update({ ...updateData, category_id: null })
        .eq('id', product.id);
      error = retryResult.error;
    }

    if (error) {
      if (error.message.includes('uuid')) {
        return;
      }
      throw new InternalError(`Failed to update product: ${error.message}`, error);
    }
  }

  public async delete(id: string): Promise<void> {
    if (id.startsWith('sample-')) {
      return;
    }

    const supabase = await this.getClient();
    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) {
      if (error.message.includes('uuid')) {
        return;
      }
      throw new InternalError(`Failed to delete product: ${error.message}`, error);
    }
  }
}
