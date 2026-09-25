import type { IProductRepository } from '@/core/domain/catalog/repositories/IProductRepository';
import type { ToggleProductStatusDTO } from '../dtos/AdminProductDTO';
import type { ProductSummaryDTO } from '../dtos/GetProductsDTO';
import { Result, ok, fail } from '@/core/domain/shared/Result';
import {
  BaseError,
  ValidationError,
  NotFoundError,
  InternalError,
} from '@/core/domain/shared/AppError';

export class ToggleProductStatusUseCase {
  constructor(private productRepository: IProductRepository) {}

  public async execute(
    dto: ToggleProductStatusDTO
  ): Promise<Result<ProductSummaryDTO, BaseError>> {
    if (!dto.id) {
      return fail(new ValidationError('상품 ID가 지정되지 않았습니다.'));
    }

    try {
      const product = await this.productRepository.findById(dto.id);
      if (!product) {
        return fail(new NotFoundError('Product', dto.id));
      }

      product.changeStatus(dto.status);
      await this.productRepository.update(product);

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
          error instanceof Error ? error.message : '상품 상태 변경 처리 중 오류 발생',
          error
        )
      );
    }
  }
}
