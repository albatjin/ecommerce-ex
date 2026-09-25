import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Category } from '@/core/domain/catalog/entities/Category';
import type { ICategoryRepository } from '@/core/domain/catalog/repositories/ICategoryRepository';
import { GetAdminCategoryTreeUseCase } from './GetAdminCategoryTreeUseCase';
import { CreateCategoryUseCase } from './CreateCategoryUseCase';
import { UpdateCategoryUseCase } from './UpdateCategoryUseCase';
import { DeleteCategoryUseCase } from './DeleteCategoryUseCase';
import { ReorderCategoriesUseCase } from './ReorderCategoriesUseCase';

describe('Admin Category Use Cases', () => {
  let mockCategoryRepo: ICategoryRepository;
  let categories: Category[];

  beforeEach(() => {
    const cat1 = Category.create(
      { name: '의류', slug: 'clothing', depth: 1, sortOrder: 1, isActive: true },
      'cat-1'
    ).getValue();

    const cat2 = Category.create(
      { name: '상의', slug: 'tops', parentId: 'cat-1', depth: 2, sortOrder: 1, isActive: true },
      'cat-2'
    ).getValue();

    const cat3 = Category.create(
      { name: '반팔티', slug: 't-shirts', parentId: 'cat-2', depth: 3, sortOrder: 1, isActive: false },
      'cat-3'
    ).getValue();

    const cat4 = Category.create(
      { name: '전자제품', slug: 'electronics', depth: 1, sortOrder: 2, isActive: true },
      'cat-4'
    ).getValue();

    categories = [cat1, cat2, cat3, cat4];

    mockCategoryRepo = {
      findById: vi.fn(async (id: string) => categories.find((c) => c.id === id) || null),
      findBySlug: vi.fn(async (slug: string) => categories.find((c) => c.slug === slug) || null),
      findAllActive: vi.fn(async () => categories.filter((c) => c.isActive)),
      findAll: vi.fn(async () => [...categories]),
      findByParentId: vi.fn(async (parentId: string | null) =>
        categories.filter((c) => (parentId === null ? !c.parentId : c.parentId === parentId))
      ),
      save: vi.fn(async (cat: Category) => {
        categories.push(cat);
      }),
      update: vi.fn(async (cat: Category) => {
        const idx = categories.findIndex((c) => c.id === cat.id);
        if (idx !== -1) categories[idx] = cat;
      }),
      delete: vi.fn(async (id: string) => {
        categories = categories.filter((c) => c.id !== id);
      }),
    };
  });

  describe('GetAdminCategoryTreeUseCase', () => {
    it('활성 및 비활성 카테고리를 포함하여 3단계 계층 트리를 구성한다', async () => {
      const useCase = new GetAdminCategoryTreeUseCase(mockCategoryRepo);
      const result = await useCase.execute();

      expect(result.isSuccess).toBe(true);
      const tree = result.getValue();

      expect(tree).toHaveLength(2); // '의류', '전자제품'
      expect(tree[0].name).toBe('의류');
      expect(tree[0].children).toHaveLength(1); // '상의'
      expect(tree[0].children[0].name).toBe('상의');
      expect(tree[0].children[0].children).toHaveLength(1); // '반팔티' (비활성 포함)
      expect(tree[0].children[0].children[0].name).toBe('반팔티');
      expect(tree[0].children[0].children[0].isActive).toBe(false);
    });
  });

  describe('CreateCategoryUseCase', () => {
    it('루트 카테고리(대분류)를 정상 생성한다', async () => {
      const useCase = new CreateCategoryUseCase(mockCategoryRepo);
      const result = await useCase.execute({
        name: '뷰티',
        slug: 'beauty',
        sortOrder: 3,
      });

      expect(result.isSuccess).toBe(true);
      const created = result.getValue();
      expect(created.name).toBe('뷰티');
      expect(created.depth).toBe(1);
      expect(created.parentId).toBeNull();
      expect(mockCategoryRepo.save).toHaveBeenCalled();
    });

    it('상위 카테고리를 지정하여 중분류 카테고리를 생성한다', async () => {
      const useCase = new CreateCategoryUseCase(mockCategoryRepo);
      const result = await useCase.execute({
        name: '스마트폰',
        slug: 'smartphones',
        parentId: 'cat-4', // 전자제품 (depth: 1)
      });

      expect(result.isSuccess).toBe(true);
      const created = result.getValue();
      expect(created.name).toBe('스마트폰');
      expect(created.depth).toBe(2);
      expect(created.parentId).toBe('cat-4');
    });

    it('소분류(depth 3)에 하위 카테고리를 추가하려 하면 에러를 반환한다', async () => {
      const useCase = new CreateCategoryUseCase(mockCategoryRepo);
      const result = await useCase.execute({
        name: '오버핏반팔',
        slug: 'overfit-t-shirts',
        parentId: 'cat-3', // 반팔티 (depth: 3)
      });

      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('최대 3단계');
    });

    it('중복된 슬러그는 생성을 거부한다', async () => {
      const useCase = new CreateCategoryUseCase(mockCategoryRepo);
      const result = await useCase.execute({
        name: '상의 복제',
        slug: 'tops', // 이미 존재함
      });

      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('이미 존재하는 슬러그');
    });
  });

  describe('UpdateCategoryUseCase', () => {
    it('카테고리 정보를 성공적으로 수정한다', async () => {
      const useCase = new UpdateCategoryUseCase(mockCategoryRepo);
      const result = await useCase.execute({
        id: 'cat-1',
        name: '패션/의류',
        isActive: false,
      });

      expect(result.isSuccess).toBe(true);
      const updated = result.getValue();
      expect(updated.name).toBe('패션/의류');
      expect(updated.isActive).toBe(false);
      expect(mockCategoryRepo.update).toHaveBeenCalled();
    });

    it('자기 자신을 상위 카테고리로 지정할 수 없다', async () => {
      const useCase = new UpdateCategoryUseCase(mockCategoryRepo);
      const result = await useCase.execute({
        id: 'cat-1',
        parentId: 'cat-1',
      });

      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('자기 자신을 상위 카테고리');
    });

    it('하위 카테고리가 있는 경우 3단계(소분류)로 이동할 수 없다', async () => {
      const useCase = new UpdateCategoryUseCase(mockCategoryRepo);
      // cat-2('상의')는 cat-3('반팔티')를 자식으로 가지고 있음
      // cat-2의 부모를 cat-2의 자식이 아닌 다른 depth 2 카테고리로 이동하려고 하면 depth가 3이 됨
      const depth2Cat = Category.create(
        { name: '노트북', slug: 'laptops', parentId: 'cat-4', depth: 2, sortOrder: 1, isActive: true },
        'cat-5'
      ).getValue();
      categories.push(depth2Cat);

      const result = await useCase.execute({
        id: 'cat-2',
        parentId: 'cat-5', // cat-5 is depth 2 -> cat-2 would become depth 3, but cat-2 has children!
      });

      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('하위 카테고리가 있는 카테고리는 소분류(3단계)로 이동할 수 없습니다');
    });
  });

  describe('DeleteCategoryUseCase', () => {
    it('하위 카테고리가 있는 카테고리는 삭제를 거부한다', async () => {
      const useCase = new DeleteCategoryUseCase(mockCategoryRepo);
      const result = await useCase.execute('cat-1');

      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('하위 카테고리가 1개 존재하여 삭제할 수 없습니다');
    });

    it('하위 카테고리가 없는 말단 카테고리는 삭제된다', async () => {
      const useCase = new DeleteCategoryUseCase(mockCategoryRepo);
      const result = await useCase.execute('cat-3');

      expect(result.isSuccess).toBe(true);
      expect(mockCategoryRepo.delete).toHaveBeenCalledWith('cat-3');
    });
  });

  describe('ReorderCategoriesUseCase', () => {
    it('카테고리들의 순서를 일괄 변경한다', async () => {
      const useCase = new ReorderCategoriesUseCase(mockCategoryRepo);
      const result = await useCase.execute([
        { id: 'cat-1', sortOrder: 2 },
        { id: 'cat-4', sortOrder: 1 },
      ]);

      expect(result.isSuccess).toBe(true);
      expect(mockCategoryRepo.update).toHaveBeenCalled();
    });
  });
});
