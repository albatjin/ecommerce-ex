import { Product } from '@/core/domain/catalog/entities/Product';
import { ProductVariant } from '@/core/domain/catalog/entities/ProductVariant';
import { Money } from '@/core/domain/catalog/value-objects/Money';
import { Stock } from '@/core/domain/catalog/value-objects/Stock';
import { Discount } from '@/core/domain/catalog/value-objects/Discount';
import type { Database, Json } from '@/shared/types/database.types';
import { resolveCategoryUuid } from '@/shared/data/defaultCategories';

type ProductRow = Database['public']['Tables']['products']['Row'];
type ProductInsert = Database['public']['Tables']['products']['Insert'];
type ProductUpdate = Database['public']['Tables']['products']['Update'];

type ProductVariantRow = Database['public']['Tables']['product_variants']['Row'];
type ProductVariantInsert = Database['public']['Tables']['product_variants']['Insert'];
type ProductVariantUpdate = Database['public']['Tables']['product_variants']['Update'];

/**
 * 상품 및 상품 옵션 DB Row ↔ Domain Entity 매퍼
 */
export class ProductMapper {
  /**
   * Supabase DB Row를 Domain Product 엔티티로 변환
   */
  public static toDomain(row: ProductRow, variantRows: ProductVariantRow[] = []): Product {
    const regularMoney = Money.create(Number(row.regular_price));
    const saleMoney = Money.create(Number(row.sale_price));
    const discount = Discount.create(regularMoney, saleMoney);
    const stock = Stock.create(Number(row.stock_quantity), Number(row.safety_stock));
    const shippingFee = Money.create(Number(row.shipping_fee));

    const variants = variantRows.map((v) => this.variantToDomain(v));

    let additionalImages: string[] = [];
    if (Array.isArray(row.additional_images)) {
      additionalImages = row.additional_images.map((img) => String(img));
    }

    const result = Product.create(
      {
        productCode: row.product_code,
        nameKo: row.name_ko,
        nameEn: row.name_en,
        categoryId: row.category_id,
        discount,
        taxType: row.tax_type,
        maxOrderQuantity: row.max_order_quantity,
        stock,
        status: row.status,
        skuCode: row.sku_code,
        manufacturer: row.manufacturer,
        brandName: row.brand_name,
        description: row.description,
        coverImageUrl: row.cover_image_url,
        additionalImages,
        shippingFee,
        originAddress: row.origin_address,
        variants,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      },
      row.id
    );

    if (result.isFailure) {
      throw new Error(`Failed to map ProductRow to Domain: ${result.getError().message}`);
    }

    return result.getValue();
  }

  /**
   * Supabase DB Row를 Domain ProductVariant 엔티티로 변환
   */
  public static variantToDomain(row: ProductVariantRow): ProductVariant {
    const additionalPrice = Money.create(Number(row.additional_price));
    const stock = Stock.create(Number(row.stock_quantity));

    const options: Record<string, string> =
      typeof row.options === 'object' && row.options !== null && !Array.isArray(row.options)
        ? (row.options as Record<string, string>)
        : {};

    const result = ProductVariant.create(
      {
        productId: row.product_id,
        skuCode: row.sku_code,
        variantName: row.variant_name,
        options,
        additionalPrice,
        stock,
        status: row.status,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      },
      row.id
    );

    if (result.isFailure) {
      throw new Error(`Failed to map ProductVariantRow to Domain: ${result.getError().message}`);
    }

    return result.getValue();
  }

  /**
   * Domain Product 엔티티를 DB Insert 데이터로 변환
   */
  public static toPersistence(product: Product): ProductInsert {
    return {
      id: product.id,
      product_code: product.productCode,
      name_ko: product.nameKo,
      name_en: product.nameEn ?? null,
      category_id: resolveCategoryUuid(product.categoryId),
      regular_price: product.regularPrice.amount,
      sale_price: product.salePrice.amount,
      discount_rate: product.discountRate,
      tax_type: product.taxType,
      max_order_quantity: product.maxOrderQuantity,
      stock_quantity: product.stock.quantity,
      safety_stock: product.stock.safetyStock,
      status: product.status,
      sku_code: product.skuCode ?? null,
      manufacturer: product.manufacturer ?? null,
      brand_name: product.brandName ?? null,
      description: product.description ?? null,
      cover_image_url: product.coverImageUrl ?? null,
      additional_images: product.additionalImages as unknown as Json,
      shipping_fee: product.shippingFee.amount,
      origin_address: product.originAddress ?? null,
      created_at: product.createdAt.toISOString(),
      updated_at: product.updatedAt.toISOString(),
    };
  }

  /**
   * Domain Product 엔티티를 DB Update 데이터로 변환
   */
  public static toUpdatePersistence(product: Product): ProductUpdate {
    return {
      product_code: product.productCode,
      name_ko: product.nameKo,
      name_en: product.nameEn ?? null,
      category_id: resolveCategoryUuid(product.categoryId),
      regular_price: product.regularPrice.amount,
      sale_price: product.salePrice.amount,
      discount_rate: product.discountRate,
      tax_type: product.taxType,
      max_order_quantity: product.maxOrderQuantity,
      stock_quantity: product.stock.quantity,
      safety_stock: product.stock.safetyStock,
      status: product.status,
      sku_code: product.skuCode ?? null,
      manufacturer: product.manufacturer ?? null,
      brand_name: product.brandName ?? null,
      description: product.description ?? null,
      cover_image_url: product.coverImageUrl ?? null,
      additional_images: product.additionalImages as unknown as Json,
      shipping_fee: product.shippingFee.amount,
      origin_address: product.originAddress ?? null,
      updated_at: product.updatedAt.toISOString(),
    };
  }

  /**
   * Domain ProductVariant 엔티티를 DB Insert 데이터로 변환
   */
  public static variantToPersistence(variant: ProductVariant): ProductVariantInsert {
    return {
      id: variant.id,
      product_id: variant.productId,
      sku_code: variant.skuCode,
      variant_name: variant.variantName,
      options: variant.options as unknown as Json,
      additional_price: variant.additionalPrice.amount,
      stock_quantity: variant.stock.quantity,
      status: variant.status,
      created_at: variant.createdAt.toISOString(),
      updated_at: variant.updatedAt.toISOString(),
    };
  }

  /**
   * Domain ProductVariant 엔티티를 DB Update 데이터로 변환
   */
  public static variantToUpdatePersistence(variant: ProductVariant): ProductVariantUpdate {
    return {
      sku_code: variant.skuCode,
      variant_name: variant.variantName,
      options: variant.options as unknown as Json,
      additional_price: variant.additionalPrice.amount,
      stock_quantity: variant.stock.quantity,
      status: variant.status,
      updated_at: variant.updatedAt.toISOString(),
    };
  }
}

