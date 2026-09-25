import { describe, it, expect, vi } from 'vitest';
import { GetProductsUseCase } from './GetProductsUseCase';
import { Product } from '@/core/domain/catalog/entities/Product';
import { Category } from '@/core/domain/catalog/entities/Category';
import { Money } from '@/core/domain/catalog/value-objects/Money';
import { Stock } from '@/core/domain/catalog/value-objects/Stock';
import { Discount } from '@/core/domain/catalog/value-objects/Discount';
import type { IProductRepository } from '@/core/domain/catalog/repositories/IProductRepository';
import type { ICategoryRepository } from '@/core/domain/catalog/repositories/ICategoryRepository';

describe('GetProductsUseCase', () => {
  const createSampleProduct = (id: string, nameKo: string, price: number) => {
    const regular = Money.create(price);
    const sale = Money.create(price);
    const discount = Discount.create(regular, sale);
    const stock = Stock.create(20);
    const shippingFee = Money.create(3000);

    return Product.create(
      {
        productCode: `PROD-${id}`,
        nameKo,
        discount,
        taxType: 'TAXABLE',
        maxOrderQuantity: 10,
        stock,
        status: 'ACTIVE',
        additionalImages: [],
        shippingFee,
      },
      id
    ).getValue();
  };

  it('기본 파라미터로 상품 목록과 페이지네이션 정보를 정상 반환한다', async () => {
    const sampleProducts = [
      createSampleProduct('1', '린넨 셔츠', 45000),
      createSampleProduct('2', '슬랙스 팬츠', 59000),
    ];

    const mockProductRepo: IProductRepository = {
      findById: vi.fn(),
      findByProductCode: vi.fn(),
      findMany: vi.fn().mockResolvedValue({
        products: sampleProducts,
        totalCount: 2,
      }),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    const useCase = new GetProductsUseCase(mockProductRepo);
    const result = await useCase.execute();

    expect(result.isSuccess).toBe(true);
    const data = result.getValue();
    expect(data.products).toHaveLength(2);
    expect(data.totalCount).toBe(2);
    expect(data.currentPage).toBe(1);
    expect(data.totalPages).toBe(1);
    expect(data.hasNextPage).toBe(false);
    expect(data.hasPrevPage).toBe(false);
    expect(data.products[0].nameKo).toBe('린넨 셔츠');
    expect(data.products[0].isOrderable).toBe(true);
  });

  it('페이지와 한도에 따라 totalPages, hasNextPage, hasPrevPage를 정확히 계산한다', async () => {
    const mockProductRepo: IProductRepository = {
      findById: vi.fn(),
      findByProductCode: vi.fn(),
      findMany: vi.fn().mockImplementation(({ limit, offset }) => {
        expect(limit).toBe(10);
        expect(offset).toBe(10); // page 2: (2 - 1) * 10
        return Promise.resolve({
          products: [createSampleProduct('11', '상품 11', 10000)],
          totalCount: 25,
        });
      }),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    const useCase = new GetProductsUseCase(mockProductRepo);
    const result = await useCase.execute({ page: 2, limit: 10 });

    expect(result.isSuccess).toBe(true);
    const data = result.getValue();
    expect(data.currentPage).toBe(2);
    expect(data.totalPages).toBe(3); // ceil(25 / 10) = 3
    expect(data.hasNextPage).toBe(true);
    expect(data.hasPrevPage).toBe(true);
  });

  it('categorySlug가 전달되면 카테고리 ID를 조회하여 상품 목록을 필터링한다', async () => {
    const mockCategory = Category.create({
      name: '아우터',
      slug: 'outer',
      depth: 1,
      sortOrder: 1,
      isActive: true,
    }, 'cat-outer-uuid').getValue();

    const mockCategoryRepo: ICategoryRepository = {
      findById: vi.fn(),
      findBySlug: vi.fn().mockResolvedValue(mockCategory),
      findAllActive: vi.fn(),
      findAll: vi.fn(),
      findByParentId: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    const mockProductRepo: IProductRepository = {
      findById: vi.fn(),
      findByProductCode: vi.fn(),
      findMany: vi.fn().mockImplementation(({ categoryId }) => {
        expect(categoryId).toBe('cat-outer-uuid');
        return Promise.resolve({ products: [], totalCount: 0 });
      }),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    const useCase = new GetProductsUseCase(mockProductRepo, mockCategoryRepo);
    const result = await useCase.execute({ categorySlug: 'outer' });

    expect(result.isSuccess).toBe(true);
    expect(mockCategoryRepo.findBySlug).toHaveBeenCalledWith('outer');
  });

  it('리포지토리 오류 발생 시 fail Result를 반환한다', async () => {
    const mockProductRepo: IProductRepository = {
      findById: vi.fn(),
      findByProductCode: vi.fn(),
      findMany: vi.fn().mockRejectedValue(new Error('Database Query Error')),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    const useCase = new GetProductsUseCase(mockProductRepo);
    const result = await useCase.execute();

    expect(result.isFailure).toBe(true);
    expect(result.getError().message).toContain('상품 목록');
  });
});

