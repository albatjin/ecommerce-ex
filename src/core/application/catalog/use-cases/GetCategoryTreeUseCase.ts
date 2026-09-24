import type { ICategoryRepository } from '@/core/domain/catalog/repositories/ICategoryRepository';
import type { Category } from '@/core/domain/catalog/entities/Category';
import { Result, ok, fail } from '@/core/domain/shared/Result';
import { AppError, InternalError } from '@/core/domain/shared/AppError';
import type { CategoryTreeNode } from '../dtos/CategoryTreeDTO';

export class GetCategoryTreeUseCase {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  public async execute(): Promise<Result<CategoryTreeNode[], AppError>> {
    try {
      const categories = await this.categoryRepository.findAllActive();
      const tree = this.buildTree(categories);
      return ok(tree);
    } catch (error) {
      if (error instanceof AppError) {
        return fail(error);
      }
      return fail(new InternalError('카테고리 트리를 생성하는 중 오류가 발생했습니다.', error));
    }
  }

  private buildTree(categories: Category[]): CategoryTreeNode[] {
    const nodesById = new Map<string, CategoryTreeNode>();
    const roots: CategoryTreeNode[] = [];

    // Pass 1: 노드 맵 초기화
    for (const cat of categories) {
      nodesById.set(cat.id, {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        depth: cat.depth,
        sortOrder: cat.sortOrder,
        parentId: cat.parentId ?? null,
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
    const sortRecursively = (nodes: CategoryTreeNode[]): void => {
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
