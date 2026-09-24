import { describe, it, expect } from 'vitest';
import { ProductMapper } from './ProductMapper';
import { ProductVariant } from '@/core/domain/catalog/entities/ProductVariant';
import { Money } from '@/core/domain/catalog/value-objects/Money';
import { Stock } from '@/core/domain/catalog/value-objects/Stock';
import type { Database } from '@/shared/types/database.types';

type ProductRow = Database['public']['Tables']['products']['Row'];
type ProductVariantRow = Database['public']['Tables']['product_variants']['Row'];

describe('ProductMapper', () => {
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

  it('toDomain: ProductRow 및 VariantRow를 Product 엔티티로 변환한다', () => {
    const product = ProductMapper.toDomain(sampleProductRow, [sampleVariantRow]);

    expect(product.id).toBe('prod-uuid-1');
    expect(product.productCode).toBe('PROD-1001');
    expect(product.nameKo).toBe('캐시미어 싱글 코트');
    expect(product.nameEn).toBe('Cashmere Single Coat');
    expect(product.regularPrice.amount).toBe(250000);
    expect(product.salePrice.amount).toBe(199000);
    expect(product.discountRate).toBe(20);
    expect(product.stock.quantity).toBe(30);
    expect(product.status).toBe('ACTIVE');
    expect(product.variants).toHaveLength(1);
    expect(product.variants[0].skuCode).toBe('COAT-01-BLK-L');
    expect(product.variants[0].additionalPrice.amount).toBe(10000);
  });

  it('toPersistence: Product 엔티티를 DB Insert 데이터로 변환한다', () => {
    const product = ProductMapper.toDomain(sampleProductRow);
    const insertData = ProductMapper.toPersistence(product);

    expect(insertData.id).toBe('prod-uuid-1');
    expect(insertData.product_code).toBe('PROD-1001');
    expect(insertData.regular_price).toBe(250000);
    expect(insertData.sale_price).toBe(199000);
    expect(insertData.stock_quantity).toBe(30);
    expect(insertData.shipping_fee).toBe(3000);
  });

  it('toUpdatePersistence: Product 엔티티를 DB Update 데이터로 변환한다', () => {
    const product = ProductMapper.toDomain(sampleProductRow);
    product.update({ nameKo: '캐시미어 더블 코트' });
    const updateData = ProductMapper.toUpdatePersistence(product);

    expect(updateData.name_ko).toBe('캐시미어 더블 코트');
    expect(updateData.product_code).toBe('PROD-1001');
  });

  it('variantToDomain & variantToPersistence: SKU 옵션 변환이 완벽하게 일치한다', () => {
    const variant = ProductMapper.variantToDomain(sampleVariantRow);
    expect(variant.id).toBe('var-uuid-1');
    expect(variant.variantName).toBe('블랙 / L');
    expect(variant.options).toEqual({ color: 'Black', size: 'L' });

    const insertData = ProductMapper.variantToPersistence(variant);
    expect(insertData.id).toBe('var-uuid-1');
    expect(insertData.product_id).toBe('prod-uuid-1');
    expect(insertData.additional_price).toBe(10000);
    expect(insertData.stock_quantity).toBe(10);
  });
});
