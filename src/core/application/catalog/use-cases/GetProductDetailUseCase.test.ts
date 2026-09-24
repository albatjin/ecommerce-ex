import { describe, it, expect, vi } from 'vitest';
import { GetProductDetailUseCase } from './GetProductDetailUseCase';
import { Product } from '@/core/domain/catalog/entities/Product';
import { ProductVariant } from '@/core/domain/catalog/entities/ProductVariant';
import { Category } from '@/core/domain/catalog/entities/Category';
import { Money } from '@/core/domain/catalog/value-objects/Money';
import { Stock } from '@/core/domain/catalog/value-objects/Stock';
import { Discount } from '@/core/domain/catalog/value-objects/Discount';
import { NotFoundError } from '@/core/domain/shared/AppError';
import type { IProductRepository } from '@/core/domain/catalog/repositories/IProductRepository';
import type { ICategoryRepository } from '@/core/domain/catalog/repositories/ICategoryRepository';

describe('GetProductDetailUseCase', () => {
  const createSampleProductWithVariants = () => {
    const regular = Money.create(150000);
    const sale = Money.create(120000);
    const discount = Discount.create(regular, sale);
    const stock = Stock.create(25, 5);
    const shippingFee = Money.create(3000);

    const product = Product.create(
      {
        productCode: 'PROD-DETAIL-01',
        nameKo: '프리미엄 린넨 셋업 자켓',
        nameEn: 'Premium Linen Setup Jacket',
        categoryId: 'cat-linen-setup',
        discount,
        taxType: 'TAXABLE',
        maxOrderQuantity: 5,
        stock,
        status: 'ACTIVE',
        brandName: 'Studio Minimal',
        description: '시원하고 통기성이 뛰어난 린넨 셋업 자켓입니다.',
        coverImageUrl: 'https://example.com/jacket.jpg',
        additionalImages: ['https://example.com/jacket-back.jpg'],
        shippingFee,
      },
      'prod-jacket-1'
    ).getValue();

    const variant = ProductVariant.create(
      {
        productId: 'prod-jacket-1',
        skuCode: 'JKT-BEG-L',
        variantName: '베이지 / L',
        options: { color: 'Beige', size: 'L' },
        additionalPrice: Money.create(5000),
        stock: Stock.create(10),
      },
      'var-1'
    ).getValue();

    product.addVariant(variant);
    return product;
  };

  it('상품 ID로 조회 성공 시 상세 정보, 카테고리명, 옵션 목록을 정상 반환한다', async () => {
    const sampleProduct = createSampleProductWithVariants();

    const mockCategory = Category.create(
      {
        name: '자켓/아우터',
        slug: 'jackets',
        depth: 2,
        sortOrder: 1,
        isActive: true,
      },
      'cat-linen-setup'
    ).getValue();

    const mockProductRepo: IProductRepository = {
      findById: vi.fn().mockResolvedValue(sampleProduct),
      findByProductCode: vi.fn(),
      findMany: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    const mockCategoryRepo: ICategoryRepository = {
      findById: vi.fn().mockResolvedValue(mockCategory),
      findBySlug: vi.fn(),
      findAllActive: vi.fn(),
      findByParentId: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    const useCase = new GetProductDetailUseCase(mockProductRepo, mockCategoryRepo);
    const result = await useCase.execute('prod-jacket-1');

    expect(result.isSuccess).toBe(true);
    const detail = result.getValue();
    expect(detail.id).toBe('prod-jacket-1');
    expect(detail.nameKo).toBe('프리미엄 린넨 셋업 자켓');
    expect(detail.regularPrice).toBe(150000);
    expect(detail.salePrice).toBe(120000);
    expect(detail.discountRate).toBe(20);
    expect(detail.categoryName).toBe('자켓/아우터');
    expect(detail.categorySlug).toBe('jackets');
    expect(detail.variants).toHaveLength(1);
    expect(detail.variants[0].variantName).toBe('베이지 / L');
    expect(detail.variants[0].additionalPrice).toBe(5000);
    expect(detail.variants[0].isAvailable).toBe(true);
  });

  it('존재하지 않는 상품 ID 조회 시 NotFoundError를 반환한다', async () => {
    const mockProductRepo: IProductRepository = {
      findById: vi.fn().mockResolvedValue(null),
      findByProductCode: vi.fn(),
      findMany: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    const useCase = new GetProductDetailUseCase(mockProductRepo);
    const result = await useCase.execute('non-existent-id');

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBeInstanceOf(NotFoundError);
    expect(result.getError().statusCode).toBe(404);
  });

  it('리포지토리 에러 발생 시 fail Result를 반환한다', async () => {
    const mockProductRepo: IProductRepository = {
      findById: vi.fn().mockRejectedValue(new Error('DB Connection Timeout')),
      findByProductCode: vi.fn(),
      findMany: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    const useCase = new GetProductDetailUseCase(mockProductRepo);
    const result = await useCase.execute('prod-jacket-1');

    expect(result.isFailure).toBe(true);
    expect(result.getError().message).toContain('상품 상세 정보');
  });
});

