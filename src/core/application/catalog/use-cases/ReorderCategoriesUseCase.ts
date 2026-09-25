import type { ICategoryRepository } from '@/core/domain/catalog/repositories/ICategoryRepository';
import { Result, ok, fail } from '@/core/domain/shared/Result';
import {
  AppError,
  ValidationError,
  InternalError,
} from '@/core/domain/shared/AppError';
import type { ReorderCategoryItemDTO } from '../dtos/AdminCategoryDTO';

export class ReorderCategoriesUseCase {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  public async execute(items: ReorderCategoryItemDTO[]): Promise<Result<void, AppError>> {
    try {
      if (!items || items.length === 0) {
        return fail(new ValidationError('순서를 변경할 카테고리 목록이 비어있습니다.'));
      }

      for (const item of items) {
        const category = await this.categoryRepository.findById(item.id);
        if (category && category.sortOrder !== item.sortOrder) {
          category.update({ sortOrder: item.sortOrder });
          await this.categoryRepository.update(category);
        }
      }

      return ok(undefined);
    } catch (error) {
      if (error instanceof AppError) {
        return fail(error);
      }
      return fail(new InternalError('카테고리 순서 변경 중 오류가 발생했습니다.', error));
    }
  }
}
