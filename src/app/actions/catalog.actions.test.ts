import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getCategoryTreeAction,
  getProductsAction,
  getProductDetailAction,
} from './catalog.actions';

// Mock SupabaseCategoryRepository
vi.mock('@/core/infrastructure/repositories/SupabaseCategoryRepository', () => {
  return {
    SupabaseCategoryRepository: class {
      async findAllActive() {
        const { Category } = await import('@/core/domain/catalog/entities/Category');
        return [
          Category.create(
            {
              name: '의류',
              slug: 'clothing',
              depth: 1,
              sortOrder: 1,
              isActive: true,
            },
            'cat-1'
          ).getValue(),
        ];
      }
      async findBySlug() {
        return null;
      }
      async findById() {
        return null;
      }
    },
  };
});

// Mock SupabaseProductRepository
vi.mock('@/core/infrastructure/repositories/SupabaseProductRepository', () => {
  return {
    SupabaseProductRepository: class {
      private async getSampleProduct() {
        const { Product } = await import('@/core/domain/catalog/entities/Product');
        const { Money } = await import('@/core/domain/catalog/value-objects/Money');
        const { Stock } = await import('@/core/domain/catalog/value-objects/Stock');
        const { Discount } = await import('@/core/domain/catalog/value-objects/Discount');

        return Product.create(
          {
            productCode: 'PROD-1',
            nameKo: '테스트 코트',
            discount: Discount.create(Money.create(100000), Money.create(80000)),
            taxType: 'TAXABLE',
            maxOrderQuantity: 5,
            stock: Stock.create(10),
            status: 'ACTIVE',
            additionalImages: [],
            shippingFee: Money.create(3000),
          },
          'prod-1'
        ).getValue();
      }

      async findMany() {
        const sample = await this.getSampleProduct();
        return {
          products: [sample],
          totalCount: 1,
        };
      }

      async findById(id: string) {
        if (id === 'prod-1') {
          return await this.getSampleProduct();
        }
        return null;
      }
    },
  };
});

describe('catalog.actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getCategoryTreeAction: 카테고리 트리를 정상 반환한다', async () => {
    const result = await getCategoryTreeAction();

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data).toHaveLength(1);
    expect(result.data?.[0].name).toBe('의류');
  });

  it('getProductsAction: 상품 목록 및 페이지네이션 결과를 정상 반환한다', async () => {
    const result = await getProductsAction({ page: 1, limit: 12 });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.products).toHaveLength(1);
    expect(result.data?.products[0].nameKo).toBe('테스트 코트');
    expect(result.data?.products[0].salePrice).toBe(80000);
    expect(result.data?.totalCount).toBe(1);
  });

  it('getProductDetailAction: 상품 상세 정보를 정상 반환한다', async () => {
    const result = await getProductDetailAction('prod-1');

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.id).toBe('prod-1');
    expect(result.data?.nameKo).toBe('테스트 코트');
  });

  it('getProductDetailAction: 미존재 상품 조회 시 statusCode 404를 반환한다', async () => {
    const result = await getProductDetailAction('non-existent');

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(404);
  });
});
