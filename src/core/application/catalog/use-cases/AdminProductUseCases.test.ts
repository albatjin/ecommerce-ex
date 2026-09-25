import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateProductUseCase } from './CreateProductUseCase';
import { UpdateProductUseCase } from './UpdateProductUseCase';
import { ToggleProductStatusUseCase } from './ToggleProductStatusUseCase';
import { DeleteProductUseCase } from './DeleteProductUseCase';
import { Product } from '@/core/domain/catalog/entities/Product';
import { Money } from '@/core/domain/catalog/value-objects/Money';
import { Stock } from '@/core/domain/catalog/value-objects/Stock';
import { Discount } from '@/core/domain/catalog/value-objects/Discount';
import type { IProductRepository } from '@/core/domain/catalog/repositories/IProductRepository';

function createSampleProduct(id = 'prod-1') {
  return Product.create(
    {
      productCode: 'PROD-00001',
      nameKo: '테스트 상품',
      discount: Discount.create(Money.create(20000), Money.create(18000)),
      taxType: 'TAXABLE',
      maxOrderQuantity: 10,
      stock: Stock.create(50),
      shippingFee: Money.create(3000),
      additionalImages: [],
      status: 'ACTIVE',
    },
    id
  ).getValue();
}

describe('Admin Product Use Cases', () => {
  let mockProductRepo: IProductRepository;
  let sampleProduct: Product;

  beforeEach(() => {
    sampleProduct = createSampleProduct();
    mockProductRepo = {
      findById: vi.fn().mockResolvedValue(sampleProduct),
      findByProductCode: vi.fn().mockResolvedValue(sampleProduct),
      findMany: vi.fn().mockResolvedValue({ products: [sampleProduct], totalCount: 1 }),
      save: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    };
  });

  describe('CreateProductUseCase', () => {
    it('유효한 상품 정보를 전달하면 상품을 생성하고 저장한다', async () => {
      const useCase = new CreateProductUseCase(mockProductRepo);
      const result = await useCase.execute({
        nameKo: '신규 프리미엄 스니커즈',
        regularPrice: 100000,
        salePrice: 85000,
        stockQuantity: 20,
        brandName: '나이키',
      });

      expect(result.isSuccess).toBe(true);
      expect(mockProductRepo.save).toHaveBeenCalledTimes(1);
      const product = result.getValue();
      expect(product.nameKo).toBe('신규 프리미엄 스니커즈');
      expect(product.regularPrice).toBe(100000);
      expect(product.salePrice).toBe(85000);
      expect(product.stockQuantity).toBe(20);
      expect(product.status).toBe('ACTIVE');
    });

    it('필수값(상품명 누락 또는 잘못된 가격) 누락 시 ValidationError를 반환한다', async () => {
      const useCase = new CreateProductUseCase(mockProductRepo);
      const result1 = await useCase.execute({
        nameKo: '',
        regularPrice: 10000,
        salePrice: 9000,
        stockQuantity: 10,
      });
      expect(result1.isFailure).toBe(true);

      const result2 = await useCase.execute({
        nameKo: '테스트',
        regularPrice: 10000,
        salePrice: 20000, // 판매가가 정가보다 큼
        stockQuantity: 10,
      });
      expect(result2.isFailure).toBe(true);
    });
  });

  describe('UpdateProductUseCase', () => {
    it('기존 상품의 가격, 재고 및 정보를 성공적으로 수정한다', async () => {
      const useCase = new UpdateProductUseCase(mockProductRepo);
      const result = await useCase.execute({
        id: 'prod-1',
        nameKo: '수정된 상품명',
        regularPrice: 30000,
        salePrice: 25000,
        stockQuantity: 80,
      });

      expect(result.isSuccess).toBe(true);
      expect(mockProductRepo.update).toHaveBeenCalledTimes(1);
      const updated = result.getValue();
      expect(updated.nameKo).toBe('수정된 상품명');
      expect(updated.regularPrice).toBe(30000);
      expect(updated.salePrice).toBe(25000);
      expect(updated.stockQuantity).toBe(80);
    });

    it('존재하지 않는 상품 ID를 수정하려 하면 NotFoundError를 반환한다', async () => {
      vi.mocked(mockProductRepo.findById).mockResolvedValueOnce(null);
      const useCase = new UpdateProductUseCase(mockProductRepo);
      const result = await useCase.execute({
        id: 'non-existing-id',
        nameKo: '이름',
      });

      expect(result.isFailure).toBe(true);
      expect(result.getError().name).toBe('NotFoundError');
    });
  });

  describe('ToggleProductStatusUseCase', () => {
    it('상품 상태를 OUT_OF_STOCK 또는 HIDDEN으로 변경할 수 있다', async () => {
      const useCase = new ToggleProductStatusUseCase(mockProductRepo);
      const result = await useCase.execute({
        id: 'prod-1',
        status: 'OUT_OF_STOCK',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().status).toBe('OUT_OF_STOCK');
      expect(mockProductRepo.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('DeleteProductUseCase', () => {
    it('상품 ID를 전달하면 정상적으로 삭제한다', async () => {
      const useCase = new DeleteProductUseCase(mockProductRepo);
      const result = await useCase.execute('prod-1');

      expect(result.isSuccess).toBe(true);
      expect(mockProductRepo.delete).toHaveBeenCalledWith('prod-1');
    });

    it('ID가 누락되거나 없으면 에러를 반환한다', async () => {
      const useCase = new DeleteProductUseCase(mockProductRepo);
      const result = await useCase.execute('');
      expect(result.isFailure).toBe(true);
    });
  });
});
