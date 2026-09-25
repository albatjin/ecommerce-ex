import type { ICategoryRepository } from '@/core/domain/catalog/repositories/ICategoryRepository';
import type { Category } from '@/core/domain/catalog/entities/Category';
import { Result, ok, fail } from '@/core/domain/shared/Result';
import {
  AppError,
  ValidationError,
  ConflictError,
  NotFoundError,
  DomainError,
  InternalError,
} from '@/core/domain/shared/AppError';
import type { UpdateCategoryInputDTO } from '../dtos/AdminCategoryDTO';

export class UpdateCategoryUseCase {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  public async execute(input: UpdateCategoryInputDTO): Promise<Result<Category, AppError>> {
    try {
      if (!input.id) {
        return fail(new ValidationError('카테고리 ID가 필요합니다.'));
      }

      const category = await this.categoryRepository.findById(input.id);
      if (!category) {
        return fail(new NotFoundError('카테고리', input.id));
      }

      // 슬러그 변경 시 중복 검사
      if (input.slug && input.slug.trim() !== category.slug) {
        const trimmedSlug = input.slug.trim();
        const existing = await this.categoryRepository.findBySlug(trimmedSlug);
        if (existing && existing.id !== category.id) {
          return fail(new ConflictError(`이미 존재하는 슬러그입니다: ${trimmedSlug}`));
        }
      }

      // 상위 카테고리 변경 시 검사
      let newDepth: number | undefined;
      let newParentId: string | null | undefined;

      if (input.parentId !== undefined) {
        if (input.parentId === category.id) {
          return fail(new DomainError('자기 자신을 상위 카테고리로 지정할 수 없습니다.'));
        }

        if (input.parentId && input.parentId.trim() !== '') {
          const parent = await this.categoryRepository.findById(input.parentId);
          if (!parent) {
            return fail(new NotFoundError('상위 카테고리', input.parentId));
          }

          const calculatedDepth = parent.depth + 1;
          if (calculatedDepth > 3) {
            return fail(new DomainError('카테고리는 최대 3단계(대/중/소분류)까지만 구성할 수 있습니다.'));
          }

          const children = await this.categoryRepository.findByParentId(category.id);
          if (children.length > 0 && calculatedDepth === 3) {
            return fail(new DomainError('하위 카테고리가 있는 카테고리는 소분류(3단계)로 이동할 수 없습니다.'));
          }

          newDepth = calculatedDepth;
          newParentId = parent.id;
        } else {
          // 루트 카테고리로 변경 (대분류)
          newDepth = 1;
          newParentId = null;
        }
      }

      category.update({
        name: input.name,
        slug: input.slug,
        parentId: newParentId,
        depth: newDepth,
        sortOrder: input.sortOrder,
        isActive: input.isActive,
      });

      await this.categoryRepository.update(category);
      return ok(category);
    } catch (error) {
      if (error instanceof AppError) {
        return fail(error);
      }
      return fail(new InternalError('카테고리 수정 중 오류가 발생했습니다.', error));
    }
  }
}
