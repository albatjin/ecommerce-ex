import type { IProductRepository } from '@/core/domain/catalog/repositories/IProductRepository';
import type { ICategoryRepository } from '@/core/domain/catalog/repositories/ICategoryRepository';
import type { Product } from '@/core/domain/catalog/entities/Product';
import { Result, ok, fail } from '@/core/domain/shared/Result';
import { AppError, InternalError } from '@/core/domain/shared/AppError';
import type {
  GetProductsQueryDTO,
  GetProductsResultDTO,
  ProductSummaryDTO,
} from '../dtos/GetProductsDTO';

export class GetProductsUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly categoryRepository?: ICategoryRepository
  ) {}

  public async execute(
    query: GetProductsQueryDTO = {}
  ): Promise<Result<GetProductsResultDTO, AppError>> {
    try {
      let categoryId = query.categoryId;

      // categorySlug가 전달되었고 categoryId가 없는 경우 카테고리 ID 조회
      if (!categoryId && query.categorySlug && this.categoryRepository) {
        const category = await this.categoryRepository.findBySlug(query.categorySlug);
        if (category) {
          categoryId = category.id;
        }
      }

      const page = Math.max(1, query.page || 1);
      const limit = Math.min(100, Math.max(1, query.limit || 12));
      const offset = (page - 1) * limit;

      const { products, totalCount } = await this.productRepository.findMany({
        categoryId,
        status: query.status ?? 'ACTIVE',
        searchQuery: query.searchQuery,
        minPrice: query.minPrice,
        maxPrice: query.maxPrice,
        hasDiscount: query.hasDiscount,
        sortBy: query.sortBy ?? 'created_at',
        limit,
        offset,
      });

      const productSummaries: ProductSummaryDTO[] = products.map((product) =>
        this.toSummaryDTO(product)
      );

      const totalPages = Math.ceil(totalCount / limit) || (totalCount === 0 ? 0 : 1);

      const result: GetProductsResultDTO = {
        products: productSummaries,
        totalCount,
        currentPage: page,
        totalPages,
        limit,
        hasPrevPage: page > 1,
        hasNextPage: page < totalPages,
      };

      return ok(result);
    } catch (error) {
      if (error instanceof AppError) {
        return fail(error);
      }
      return fail(new InternalError('상품 목록을 조회하는 중 오류가 발생했습니다.', error));
    }
  }

  private toSummaryDTO(product: Product): ProductSummaryDTO {
    return {
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
      isOrderable: product.isOrderable(1),
      brandName: product.brandName,
      coverImageUrl: product.coverImageUrl,
      shippingFee: product.shippingFee.amount,
      createdAt: product.createdAt.toISOString(),
    };
  }
}
