import type { ICategoryRepository } from '@/core/domain/catalog/repositories/ICategoryRepository';
import type { Category } from '@/core/domain/catalog/entities/Category';
import { Result, ok, fail } from '@/core/domain/shared/Result';
import { AppError, InternalError } from '@/core/domain/shared/AppError';
import type { AdminCategoryNodeDTO } from '../dtos/AdminCategoryDTO';

export class GetAdminCategoryTreeUseCase {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  public async execute(): Promise<Result<AdminCategoryNodeDTO[], AppError>> {
    try {
      const categories = await this.categoryRepository.findAll();
      const tree = this.buildTree(categories);
      return ok(tree);
    } catch (error) {
      if (error instanceof AppError) {
        return fail(error);
      }
      return fail(new InternalError('관리자 카테고리 트리를 불러오는 중 오류가 발생했습니다.', error));
    }
  }

  private buildTree(categories: Category[]): AdminCategoryNodeDTO[] {
    const nodesById = new Map<string, AdminCategoryNodeDTO>();
    const roots: AdminCategoryNodeDTO[] = [];

    // Pass 1: 노드 맵 초기화
    for (const cat of categories) {
      nodesById.set(cat.id, {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        parentId: cat.parentId ?? null,
        depth: cat.depth,
        sortOrder: cat.sortOrder,
        isActive: cat.isActive,
        createdAt: cat.createdAt.toISOString(),
        children: [],
      });
    }

    // Pass 2: 부모-자식 트리 관계 연결
    for (const node of nodesById.values()) {
      if (node.parentId && nodesById.has(node.parentId)) {
        const parent = nodesById.get(node.parentId)!;
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }

    // Pass 3: 정렬 순서(sortOrder) 기준 재귀 정렬
    const sortRecursively = (nodes: AdminCategoryNodeDTO[]): void => {
      nodes.sort((a, b) => a.sortOrder - b.sortOrder);
      for (const node of nodes) {
        if (node.children.length > 0) {
          sortRecursively(node.children);
        }
      }
    };

    sortRecursively(roots);
    return roots;
  }
}
