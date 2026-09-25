import type { ICategoryRepository } from '@/core/domain/catalog/repositories/ICategoryRepository';
import { Result, ok, fail } from '@/core/domain/shared/Result';
import {
  AppError,
  ValidationError,
  NotFoundError,
  DomainError,
  InternalError,
} from '@/core/domain/shared/AppError';

export class DeleteCategoryUseCase {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  public async execute(id: string): Promise<Result<void, AppError>> {
    try {
      if (!id) {
        return fail(new ValidationError('카테고리 ID가 필요합니다.'));
      }

      const category = await this.categoryRepository.findById(id);
      if (!category) {
        return fail(new NotFoundError('카테고리', id));
      }

      // 하위 카테고리가 존재하는지 검사
      const children = await this.categoryRepository.findByParentId(id);
      if (children.length > 0) {
        return fail(
          new DomainError(
            `하위 카테고리가 ${children.length}개 존재하여 삭제할 수 없습니다. 먼저 하위 카테고리를 삭제하거나 이동해주세요.`
          )
        );
      }

      await this.categoryRepository.delete(id);
      return ok(undefined);
    } catch (error) {
      if (error instanceof AppError) {
        return fail(error);
      }
      return fail(new InternalError('카테고리 삭제 중 오류가 발생했습니다.', error));
    }
  }
}

