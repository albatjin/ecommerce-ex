import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCategoryTreeAction, getProductsAction } from './catalog.actions';
import { Category } from '@/core/domain/catalog/entities/Category';
import { Product } from '@/core/domain/catalog/entities/Product';
import { Money } from '@/core/domain/catalog/value-objects/Money';
import { Stock } from '@/core/domain/catalog/value-objects/Stock';
import { Discount } from '@/core/domain/catalog/value-objects/Discount';

// Mock SupabaseCategoryRepository
vi.mock('@/core/infrastructure/repositories/SupabaseCategoryRepository', () => {
  return {
    SupabaseCategoryRepository: class {
      async findAllActive() {
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
    },
  };
});

// Mock SupabaseProductRepository
vi.mock('@/core/infrastructure/repositories/SupabaseProductRepository', () => {
  return {
    SupabaseProductRepository: class {
      async findMany() {
        return {
          products: [
            Product.create(
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
            ).getValue(),
          ],
          totalCount: 1,
        };
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
});
