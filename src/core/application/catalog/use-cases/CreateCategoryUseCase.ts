import type { ICategoryRepository } from '@/core/domain/catalog/repositories/ICategoryRepository';
import { Category } from '@/core/domain/catalog/entities/Category';
import { Result, ok, fail } from '@/core/domain/shared/Result';
import {
  AppError,
  ValidationError,
  ConflictError,
  NotFoundError,
  DomainError,
  InternalError,
} from '@/core/domain/shared/AppError';
import type { CreateCategoryInputDTO } from '../dtos/AdminCategoryDTO';

export class CreateCategoryUseCase {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  public async execute(input: CreateCategoryInputDTO): Promise<Result<Category, AppError>> {
    try {
      const name = input.name?.trim();
      const slug = input.slug?.trim();

      if (!name) {
        return fail(new ValidationError('카테고리 이름을 입력해주세요.'));
      }
      if (!slug) {
        return fail(new ValidationError('카테고리 슬러그를 입력해주세요.'));
      }

      // 슬러그 중복 확인
      const existingSlug = await this.categoryRepository.findBySlug(slug);
      if (existingSlug) {
        return fail(new ConflictError(`이미 존재하는 슬러그입니다: ${slug}`));
      }

      let depth = 1;
      let parentId: string | null = null;

      if (input.parentId && input.parentId.trim() !== '') {
        const parent = await this.categoryRepository.findById(input.parentId);
        if (!parent) {
          return fail(new NotFoundError('상위 카테고리', input.parentId));
        }

        if (parent.depth >= 3) {
          return fail(
            new DomainError('카테고리는 최대 3단계(대/중/소분류)까지만 생성할 수 있습니다.')
          );
        }

        depth = parent.depth + 1;
        parentId = parent.id;
      }

      const categoryResult = Category.create({
        name,
        slug,
        parentId,
        depth,
        sortOrder: input.sortOrder ?? 0,
        isActive: input.isActive ?? true,
      });

      if (categoryResult.isFailure) {
        return fail(categoryResult.getError());
      }

      const category = categoryResult.getValue();
      await this.categoryRepository.save(category);

      return ok(category);
    } catch (error) {
      if (error instanceof AppError) {
        return fail(error);
      }
      return fail(new InternalError('카테고리 생성 중 오류가 발생했습니다.', error));
    }
  }
}
