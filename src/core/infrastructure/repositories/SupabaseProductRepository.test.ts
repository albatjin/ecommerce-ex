import { describe, it, expect, vi } from 'vitest';
import { SupabaseProductRepository } from './SupabaseProductRepository';
import { Product } from '@/core/domain/catalog/entities/Product';
import { ProductVariant } from '@/core/domain/catalog/entities/ProductVariant';
import { Money } from '@/core/domain/catalog/value-objects/Money';
import { Stock } from '@/core/domain/catalog/value-objects/Stock';
import { Discount } from '@/core/domain/catalog/value-objects/Discount';
import type { Database } from '@/shared/types/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';

type ProductRow = Database['public']['Tables']['products']['Row'];
type ProductVariantRow = Database['public']['Tables']['product_variants']['Row'];

describe('SupabaseProductRepository', () => {
  const sampleProductRow: ProductRow = {
    id: 'prod-uuid-1',
    product_code: 'PROD-1001',
    name_ko: '캐시미어 싱글 코트',
    name_en: 'Cashmere Single Coat',
    category_id: 'cat-uuid-1',
    regular_price: 250000,
    sale_price: 199000,
    discount_rate: 20,
    tax_type: 'TAXABLE',
    max_order_quantity: 5,
    stock_quantity: 30,
    safety_stock: 5,
    status: 'ACTIVE',
    sku_code: 'COAT-01',
    manufacturer: '자체제작',
    brand_name: 'Studio Minimal',
    description: '고급 울 캐시미어 혼방 코트',
    cover_image_url: 'https://example.com/coat.jpg',
    additional_images: ['https://example.com/coat-back.jpg'],
    shipping_fee: 3000,
    origin_address: '서울특별시 동대문구',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-02T00:00:00.000Z',
  };

  const sampleVariantRow: ProductVariantRow = {
    id: 'var-uuid-1',
    product_id: 'prod-uuid-1',
    sku_code: 'COAT-01-BLK-L',
    variant_name: '블랙 / L',
    options: { color: 'Black', size: 'L' },
    additional_price: 10000,
    stock_quantity: 10,
    status: 'ACTIVE',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-02T00:00:00.000Z',
  };

  it('findById: 상품과 하위 옵션(Variant)을 함께 조회하여 Product 엔티티로 반환한다', async () => {
    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === 'products') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: sampleProductRow, error: null }),
              }),
            }),
          };
        }
        if (table === 'product_variants') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [sampleVariantRow], error: null }),
            }),
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient<Database>;

    const repo = new SupabaseProductRepository(mockClient);
    const product = await repo.findById('prod-uuid-1');

    expect(product).not.toBeNull();
    expect(product?.id).toBe('prod-uuid-1');
    expect(product?.nameKo).toBe('캐시미어 싱글 코트');
    expect(product?.variants).toHaveLength(1);
    expect(product?.variants[0].skuCode).toBe('COAT-01-BLK-L');
  });

  it('findByProductCode: 상품 코드로 조회한다', async () => {
    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === 'products') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: sampleProductRow, error: null }),
              }),
            }),
          };
        }
        if (table === 'product_variants') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient<Database>;

    const repo = new SupabaseProductRepository(mockClient);
    const product = await repo.findByProductCode('PROD-1001');

    expect(product).not.toBeNull();
    expect(product?.productCode).toBe('PROD-1001');
  });

  it('findMany: 다중 필터 및 페이지네이션을 적용하여 상품 목록과 총 개수를 반환한다', async () => {
    const rangeMock = vi.fn().mockResolvedValue({
      data: [sampleProductRow],
      count: 1,
      error: null,
    });
    const orderMock = vi.fn().mockReturnValue({ range: rangeMock });
    const queryMock = {
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      order: orderMock,
      range: rangeMock,
    };

    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue(queryMock),
      }),
    } as unknown as SupabaseClient<Database>;

    const repo = new SupabaseProductRepository(mockClient);
    const result = await repo.findMany({
      categoryId: 'cat-uuid-1',
      status: 'ACTIVE',
      searchQuery: '코트',
      minPrice: 100000,
      maxPrice: 300000,
      hasDiscount: true,
      sortBy: 'price_asc',
      limit: 10,
      offset: 0,
    });

    expect(result.products).toHaveLength(1);
    expect(result.totalCount).toBe(1);
    expect(result.products[0].nameKo).toBe('캐시미어 싱글 코트');
  });

  it('save: 상품 및 옵션을 함께 데이터베이스에 저장한다', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });

    const mockClient = {
      from: vi.fn().mockReturnValue({
        insert: insertMock,
      }),
    } as unknown as SupabaseClient<Database>;

    const repo = new SupabaseProductRepository(mockClient);

    const discount = Discount.create(Money.create(100000), Money.create(80000));
    const stock = Stock.create(20);
    const product = Product.create({
      productCode: 'PROD-2001',
      nameKo: '린넨 셔츠',
      discount,
      taxType: 'TAXABLE',
      maxOrderQuantity: 3,
      stock,
      status: 'ACTIVE',
      shippingFee: Money.create(3000),
      additionalImages: [],
    }).getValue();

    const variant = ProductVariant.create({
      productId: product.id,
      skuCode: 'SHIRT-WHT-M',
      variantName: '화이트 / M',
      options: { color: 'White', size: 'M' },
      additionalPrice: Money.zero(),
      stock: Stock.create(10),
    }).getValue();

    product.addVariant(variant);

    await repo.save(product);

    expect(insertMock).toHaveBeenCalledTimes(2); // 1st for products, 2nd for product_variants
  });

  it('update & delete: 상품 수정 및 삭제를 정상 처리한다', async () => {
    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    const deleteMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    const mockClient = {
      from: vi.fn().mockReturnValue({
        update: updateMock,
        delete: deleteMock,
      }),
    } as unknown as SupabaseClient<Database>;

    const repo = new SupabaseProductRepository(mockClient);

    const discount = Discount.create(Money.create(50000), Money.create(50000));
    const stock = Stock.create(10);
    const product = Product.create({
      productCode: 'PROD-3001',
      nameKo: '코튼 티셔츠',
      discount,
      taxType: 'TAXABLE',
      maxOrderQuantity: 10,
      stock,
      status: 'ACTIVE',
      shippingFee: Money.zero(),
      additionalImages: [],
    }).getValue();

    await repo.update(product);
    expect(updateMock).toHaveBeenCalled();

    await repo.delete(product.id);
    expect(deleteMock).toHaveBeenCalled();
  });
});

