import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAdminProductsAction,
  createProductAction,
  updateProductAction,
  toggleProductStatusAction,
  deleteProductAction,
  seedMockProductsAction,
} from './product-admin.actions';

// Mocks
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

const mockGetUser = vi.fn().mockResolvedValue({
  data: {
    user: {
      id: 'admin-1',
      email: 'albat77@nate.com',
      user_metadata: { role: 'admin' },
    },
  },
});

const createChainableMock = () => {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  chain.single = vi.fn().mockResolvedValue({ data: { id: 'p-1' }, error: null });
  chain.upsert = vi.fn().mockResolvedValue({ error: null });
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.then = (resolve: (val: unknown) => unknown) =>
    Promise.resolve({ data: { id: 'p-1' }, error: null }).then(resolve);
  return chain;
};

vi.mock('@/core/infrastructure/supabase/server', () => ({
  getServerClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: () => mockGetUser(),
    },
    from: vi.fn().mockImplementation(() => createChainableMock()),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/img.jpg' } }),
      }),
    },
  }),
}));

const mockProduct = {
  id: 'prod-101',
  productCode: 'PROD-101',
  nameKo: '테스트 상품',
  regularPrice: 20000,
  salePrice: 18000,
  discountRate: 10,
  taxType: 'TAXABLE',
  status: 'ACTIVE',
  stockQuantity: 50,
  isOrderable: true,
  createdAt: new Date().toISOString(),
};

const mockFindMany = vi.fn().mockResolvedValue({ products: [], totalCount: 0 });
const mockFindById = vi.fn();
const mockSave = vi.fn().mockResolvedValue(undefined);
const mockUpdate = vi.fn().mockResolvedValue(undefined);
const mockDelete = vi.fn().mockResolvedValue(undefined);

vi.mock('@/core/infrastructure/repositories/SupabaseProductRepository', () => {
  return {
    SupabaseProductRepository: class {
      findMany(options?: unknown) {
        return mockFindMany(options);
      }
      findById(id: string) {
        return mockFindById(id);
      }
      save(p: unknown) {
        return mockSave(p);
      }
      update(p: unknown) {
        return mockUpdate(p);
      }
      delete(id: string) {
        return mockDelete(id);
      }
    },
  };
});

describe('Product Admin Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'admin-1',
          email: 'albat77@nate.com',
          user_metadata: { role: 'admin' },
        },
      },
    });
  });

  describe('createProductAction', () => {
    it('관리자 권한이 있는 경우 신규 상품을 등록한다', async () => {
      const result = await createProductAction({
        nameKo: '신규 상품',
        regularPrice: 30000,
        salePrice: 27000,
        stockQuantity: 30,
      });

      expect(result.success).toBe(true);
      expect(result.data?.nameKo).toBe('신규 상품');
      expect(result.data?.regularPrice).toBe(30000);
      expect(result.data?.salePrice).toBe(27000);
    });

    it('관리자 권한이 없는 경우 접근을 거부한다', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: {
          user: {
            id: 'cust-1',
            email: 'buyer@test.com',
            user_metadata: { role: 'customer' },
          },
        },
      });

      const result = await createProductAction({
        nameKo: '불법 상품',
        regularPrice: 10000,
        salePrice: 9000,
        stockQuantity: 10,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('관리자 권한');
    });
  });

  describe('deleteProductAction', () => {
    it('상품 삭제를 성공적으로 실행한다', async () => {
      const { Product } = await import('@/core/domain/catalog/entities/Product');
      const { Money } = await import('@/core/domain/catalog/value-objects/Money');
      const { Stock } = await import('@/core/domain/catalog/value-objects/Stock');
      const { Discount } = await import('@/core/domain/catalog/value-objects/Discount');

      const existing = Product.create({
        productCode: 'PROD-101',
        nameKo: '삭제 대상',
        discount: Discount.create(Money.create(10000), Money.create(10000)),
        taxType: 'TAXABLE',
        maxOrderQuantity: 10,
        stock: Stock.create(10),
        shippingFee: Money.create(0),
        additionalImages: [],
      }, 'prod-101').getValue();

      mockFindById.mockResolvedValueOnce(existing);

      const result = await deleteProductAction('prod-101');
      expect(result.success).toBe(true);
      expect(mockDelete).toHaveBeenCalledWith('prod-101');
    });
  });

  describe('seedMockProductsAction', () => {
    it('관리자 권한으로 샘플 데이터를 성공적으로 시딩한다', async () => {
      const result = await seedMockProductsAction();
      expect(result.success).toBe(true);
      expect(result.data?.count).toBeGreaterThan(0);
    });

    it('관리자가 아닌 경우 시딩을 거부한다', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: {
          user: {
            id: 'cust-1',
            email: 'buyer@test.com',
            user_metadata: { role: 'customer' },
          },
        },
      });

      const result = await seedMockProductsAction();
      expect(result.success).toBe(false);
      expect(result.error).toContain('관리자 권한');
    });
  });
});
