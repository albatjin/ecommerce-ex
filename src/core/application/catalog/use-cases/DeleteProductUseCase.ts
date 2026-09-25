import type { IProductRepository } from '@/core/domain/catalog/repositories/IProductRepository';
import { Result, ok, fail } from '@/core/domain/shared/Result';
import { BaseError, ValidationError, NotFoundError, InternalError } from '@/core/domain/shared/AppError';

export class DeleteProductUseCase {
  constructor(private productRepository: IProductRepository) {}

  public async execute(id: string): Promise<Result<void, BaseError>> {
    if (!id || !id.trim()) {
      return fail(new ValidationError('삭제할 상품 ID가 지정되지 않았습니다.'));
    }

    try {
      const product = await this.productRepository.findById(id);
      if (!product) {
        return fail(new NotFoundError('Product', id));
      }

      await this.productRepository.delete(id);
      return ok(undefined);
    } catch (error) {
      if (error instanceof BaseError) return fail(error);
      return fail(
        new InternalError(
          error instanceof Error ? error.message : '상품 삭제 처리 중 오류 발생',
          error
        )
      );
    }
  }
}
