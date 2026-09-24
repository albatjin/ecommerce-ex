import type { IProductRepository } from '@/core/domain/catalog/repositories/IProductRepository';
import type { ICategoryRepository } from '@/core/domain/catalog/repositories/ICategoryRepository';
import type { Product } from '@/core/domain/catalog/entities/Product';
import { Result, ok, fail } from '@/core/domain/shared/Result';
import { AppError, NotFoundError, InternalError } from '@/core/domain/shared/AppError';
import type {
  ProductDetailDTO,
  ProductVariantDetailDTO,
} from '../dtos/ProductDetailDTO';

export class GetProductDetailUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly categoryRepository?: ICategoryRepository
  ) {}

  public async execute(id: string): Promise<Result<ProductDetailDTO, AppError>> {
    try {
      const product = await this.productRepository.findById(id);

      if (!product) {
        return fail(new NotFoundError('Product', id));
      }

      let categoryName: string | null = null;
      let categorySlug: string | null = null;

      if (product.categoryId && this.categoryRepository) {
        try {
          const category = await this.categoryRepository.findById(product.categoryId);
          if (category) {
            categoryName = category.name;
            categorySlug = category.slug;
          }
        } catch {
          // 카테고리 정보 조회 실패 시 기본값 유지
        }
      }

      const variants: ProductVariantDetailDTO[] = product.variants.map((v) => ({
        id: v.id,
        skuCode: v.skuCode,
        variantName: v.variantName,
        options: v.options,
        additionalPrice: v.additionalPrice.amount,
        stockQuantity: v.stock.quantity,
        status: v.status,
        isAvailable: v.isAvailable(),
      }));

      const detailDTO: ProductDetailDTO = {
        id: product.id,
        productCode: product.productCode,
        nameKo: product.nameKo,
        nameEn: product.nameEn,
        categoryId: product.categoryId,
        categoryName,
        categorySlug,
        regularPrice: product.regularPrice.amount,
        salePrice: product.salePrice.amount,
        discountRate: product.discountRate,
        taxType: product.taxType,
        maxOrderQuantity: product.maxOrderQuantity,
        stockQuantity: product.stock.quantity,
        safetyStock: product.stock.safetyStock,
        status: product.status,
        isOrderable: product.isOrderable(1),
        skuCode: product.skuCode,
        manufacturer: product.manufacturer,
        brandName: product.brandName,
        description: product.description,
        coverImageUrl: product.coverImageUrl,
        additionalImages: product.additionalImages,
        shippingFee: product.shippingFee.amount,
        originAddress: product.originAddress,
        variants,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
      };

      return ok(detailDTO);
    } catch (error) {
      if (error instanceof AppError) {
        return fail(error);
      }
      return fail(new InternalError('상품 상세 정보를 조회하는 중 오류가 발생했습니다.', error));
    }
  }
}

