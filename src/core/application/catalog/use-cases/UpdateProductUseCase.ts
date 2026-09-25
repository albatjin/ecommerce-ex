import type { IProductRepository } from '@/core/domain/catalog/repositories/IProductRepository';
import { Money } from '@/core/domain/catalog/value-objects/Money';
import { Stock } from '@/core/domain/catalog/value-objects/Stock';
import { Discount } from '@/core/domain/catalog/value-objects/Discount';
import type { UpdateProductInputDTO } from '../dtos/AdminProductDTO';
import type { ProductSummaryDTO } from '../dtos/GetProductsDTO';
import { Result, ok, fail } from '@/core/domain/shared/Result';
import {
  BaseError,
  ValidationError,
  NotFoundError,
  InternalError,
} from '@/core/domain/shared/AppError';

export class UpdateProductUseCase {
  constructor(private productRepository: IProductRepository) {}

  public async execute(
    dto: UpdateProductInputDTO
  ): Promise<Result<ProductSummaryDTO, BaseError>> {
    if (!dto.id) {
      return fail(new ValidationError('수정할 상품 ID가 지정되지 않았습니다.'));
    }

    try {
      const product = await this.productRepository.findById(dto.id);
      if (!product) {
        return fail(new NotFoundError('Product', dto.id));
      }

      // 가격 및 할인 갱신
      let discount = product.discount;
      if (dto.regularPrice !== undefined || dto.salePrice !== undefined) {
        const regular = dto.regularPrice !== undefined ? dto.regularPrice : product.regularPrice.amount;
        const sale = dto.salePrice !== undefined ? dto.salePrice : product.salePrice.amount;

        if (regular < 0 || sale < 0) {
          return fail(new ValidationError('가격은 0원 이상이어야 합니다.'));
        }
        if (sale > regular) {
          return fail(new ValidationError('판매가는 정가보다 클 수 없습니다.'));
        }

        discount = Discount.create(Money.create(regular), Money.create(sale));
      }

      // 기본 정보 수정
      product.update({
        nameKo: dto.nameKo,
        nameEn: dto.nameEn,
        categoryId: dto.categoryId,
        discount,
        taxType: dto.taxType,
        maxOrderQuantity: dto.maxOrderQuantity,
        brandName: dto.brandName,
        manufacturer: dto.manufacturer,
        description: dto.description,
        coverImageUrl: dto.coverImageUrl,
        additionalImages: dto.additionalImages,
        shippingFee: dto.shippingFee !== undefined ? Money.create(dto.shippingFee) : undefined,
      });

      // 재고 수량 수정
      if (dto.stockQuantity !== undefined) {
        if (dto.stockQuantity < 0) {
          return fail(new ValidationError('재고 수량은 0개 이상이어야 합니다.'));
        }
        const diff = dto.stockQuantity - product.stock.quantity;
        if (diff > 0) {
          product.restock(diff);
        } else if (diff < 0) {
          product.deductStock(Math.abs(diff));
        }
      }

      // 상태 변경
      if (dto.status !== undefined) {
        product.changeStatus(dto.status);
      }

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
          error instanceof Error ? error.message : '상품 수정 처리 중 오류 발생',
          error
        )
      );
    }
  }
}
