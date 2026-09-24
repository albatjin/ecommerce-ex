import { describe, it, expect, vi } from 'vitest';
import { GetCategoryTreeUseCase } from './GetCategoryTreeUseCase';
import { Category } from '@/core/domain/catalog/entities/Category';
import type { ICategoryRepository } from '@/core/domain/catalog/repositories/ICategoryRepository';

describe('GetCategoryTreeUseCase', () => {
  const createCategory = (
    id: string,
    name: string,
    slug: string,
    depth: number,
    sortOrder: number,
    parentId: string | null = null
  ) => {
    return Category.create(
      {
        name,
        slug,
        depth,
        sortOrder,
        parentId,
        isActive: true,
      },
      id
    ).getValue();
  };

  it('빈 카테고리 목록일 때 빈 배열([])을 반환한다', async () => {
    const mockRepo: ICategoryRepository = {
      findById: vi.fn(),
      findBySlug: vi.fn(),
      findAllActive: vi.fn().mockResolvedValue([]),
      findByParentId: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    const useCase = new GetCategoryTreeUseCase(mockRepo);
    const result = await useCase.execute();

    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toEqual([]);
  });

  it('대분류(depth 1), 중분류(depth 2), 소분류(depth 3) 계층 트리를 정상 조립한다', async () => {
    const categories = [
      createCategory('cat-1', '패션의류', 'fashion', 1, 1, null),
      createCategory('cat-2', '여성의류', 'women', 2, 1, 'cat-1'),
      createCategory('cat-3', '코트/자켓', 'coats', 3, 1, 'cat-2'),
      createCategory('cat-4', '남성의류', 'men', 2, 2, 'cat-1'),
      createCategory('cat-5', '라이프/리빙', 'living', 1, 2, null),
    ];

    const mockRepo: ICategoryRepository = {
      findById: vi.fn(),
      findBySlug: vi.fn(),
      findAllActive: vi.fn().mockResolvedValue(categories),
      findByParentId: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    const useCase = new GetCategoryTreeUseCase(mockRepo);
    const result = await useCase.execute();

    expect(result.isSuccess).toBe(true);
    const tree = result.getValue();

    expect(tree).toHaveLength(2); // 패션의류, 라이프/리빙
    expect(tree[0].id).toBe('cat-1');
    expect(tree[0].children).toHaveLength(2); // 여성의류, 남성의류
    expect(tree[0].children[0].id).toBe('cat-2');
    expect(tree[0].children[0].children).toHaveLength(1); // 코트/자켓
    expect(tree[0].children[0].children[0].id).toBe('cat-3');
    expect(tree[1].id).toBe('cat-5');
    expect(tree[1].children).toHaveLength(0);
  });

  it('동일 레벨 노드들을 sortOrder 오름차순으로 정렬한다', async () => {
    const categories = [
      createCategory('cat-2', '디지털/가전', 'digital', 1, 20, null),
      createCategory('cat-1', '패션', 'fashion', 1, 10, null),
      createCategory('cat-3', '식품', 'food', 1, 30, null),
    ];

    const mockRepo: ICategoryRepository = {
      findById: vi.fn(),
      findBySlug: vi.fn(),
      findAllActive: vi.fn().mockResolvedValue(categories),
      findByParentId: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    const useCase = new GetCategoryTreeUseCase(mockRepo);
    const result = await useCase.execute();

    expect(result.isSuccess).toBe(true);
    const tree = result.getValue();

    expect(tree[0].name).toBe('패션');
    expect(tree[1].name).toBe('디지털/가전');
    expect(tree[2].name).toBe('식품');
  });

  it('리포지토리 에러 발생 시 fail Result를 반환한다', async () => {
    const mockRepo: ICategoryRepository = {
      findById: vi.fn(),
      findBySlug: vi.fn(),
      findAllActive: vi.fn().mockRejectedValue(new Error('DB Connection Timeout')),
      findByParentId: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    const useCase = new GetCategoryTreeUseCase(mockRepo);
    const result = await useCase.execute();

    expect(result.isFailure).toBe(true);
    expect(result.getError().message).toContain('카테고리');
  });
});

