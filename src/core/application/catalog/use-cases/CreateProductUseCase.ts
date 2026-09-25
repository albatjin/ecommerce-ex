import type { IProductRepository } from '@/core/domain/catalog/repositories/IProductRepository';
import { Product } from '@/core/domain/catalog/entities/Product';
import { Money } from '@/core/domain/catalog/value-objects/Money';
import { Stock } from '@/core/domain/catalog/value-objects/Stock';
import { Discount } from '@/core/domain/catalog/value-objects/Discount';
import type { CreateProductInputDTO } from '../dtos/AdminProductDTO';
import type { ProductSummaryDTO } from '../dtos/GetProductsDTO';
import { Result, ok, fail } from '@/core/domain/shared/Result';
import { BaseError, ValidationError, InternalError } from '@/core/domain/shared/AppError';

export class CreateProductUseCase {
  constructor(private productRepository: IProductRepository) {}

  public async execute(
    dto: CreateProductInputDTO
  ): Promise<Result<ProductSummaryDTO, BaseError>> {
    if (!dto.nameKo || !dto.nameKo.trim()) {
      return fail(new ValidationError('상품명(한글)은 필수 입력 항목입니다.'));
    }

    if (dto.regularPrice < 0) {
      return fail(new ValidationError('정가는 0원 이상이어야 합니다.'));
    }

    if (dto.salePrice < 0) {
      return fail(new ValidationError('판매가는 0원 이상이어야 합니다.'));
    }

    if (dto.salePrice > dto.regularPrice) {
      return fail(new ValidationError('판매가는 정가보다 클 수 없습니다.'));
    }

    if (dto.stockQuantity < 0) {
      return fail(new ValidationError('재고 수량은 0개 이상이어야 합니다.'));
    }

    try {
      const generatedCode = `PROD-${Math.floor(Math.random() * 90000 + 10000)}`;

      const regularMoney = Money.create(dto.regularPrice);
      const saleMoney = Money.create(dto.salePrice);
      const discount = Discount.create(regularMoney, saleMoney);
      const stock = Stock.create(dto.stockQuantity);
      const shippingFee = Money.create(dto.shippingFee ?? 0);

      const productResult = Product.create({
        productCode: generatedCode,
        nameKo: dto.nameKo.trim(),
        nameEn: dto.nameEn?.trim() || null,
        categoryId: dto.categoryId || null,
        discount,
        taxType: dto.taxType ?? 'TAXABLE',
        maxOrderQuantity: dto.maxOrderQuantity ?? 10,
        stock,
        status: dto.status ?? (dto.stockQuantity > 0 ? 'ACTIVE' : 'OUT_OF_STOCK'),
        brandName: dto.brandName?.trim() || null,
        manufacturer: dto.manufacturer?.trim() || null,
        description: dto.description?.trim() || null,
        coverImageUrl: dto.coverImageUrl || null,
        additionalImages: dto.additionalImages || [],
        shippingFee,
        variants: [],
      });

      if (productResult.isFailure) {
        return fail(new ValidationError(productResult.getError().message));
      }

      const product = productResult.getValue();
      await this.productRepository.save(product);

      const summaryDTO: ProductSummaryDTO = {
        id: product.id,
        productCode: product.productCode,
        nameKo: product.nameKo,
        nameEn: product.nameEn,
        categoryId: product.categoryId,
        regularPrice: product.regularPrice.amount,
        salePrice: product.salePrice.amount,
        discountRate: product.discountRate,
        taxType: product.taxType,
        status: product.status,
        stockQuantity: product.stock.quantity,
        isOrderable: product.isOrderable(),
        brandName: product.brandName,
        coverImageUrl: product.coverImageUrl,
        shippingFee: product.shippingFee.amount,
        createdAt: product.createdAt.toISOString(),
      };

      return ok(summaryDTO);
    } catch (error) {
      if (error instanceof BaseError) return fail(error);
      return fail(
        new InternalError(
          error instanceof Error ? error.message : '상품 등록 처리 중 오류 발생',
          error
        )
      );
    }
  }
}
