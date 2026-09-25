import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAdminCategoryTreeAction,
  createCategoryAction,
  updateCategoryAction,
  toggleCategoryStatusAction,
  deleteCategoryAction,
  reorderCategoriesAction,
} from './category-admin.actions';
import { Category } from '@/core/domain/catalog/entities/Category';

const mockGetUser = vi.fn();
vi.mock('@/core/infrastructure/supabase/server', () => ({
  getServerClient: vi.fn().mockImplementation(() => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

const mockFindById = vi.fn();
const mockFindBySlug = vi.fn();
const mockFindAll = vi.fn();
const mockFindByParentId = vi.fn();
const mockSave = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock('@/core/infrastructure/repositories/SupabaseCategoryRepository', () => ({
  SupabaseCategoryRepository: class {
    findById = mockFindById;
    findBySlug = mockFindBySlug;
    findAll = mockFindAll;
    findByParentId = mockFindByParentId;
    save = mockSave;
    update = mockUpdate;
    delete = mockDelete;
  },
}));

describe('category-admin.actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'admin-1',
          email: 'albat77@nate.com',
          user_metadata: { role: 'admin' },
        },
      },
    });
  });

  it('관리자 권한이 없으면 에러를 반환한다', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: {
        user: {
          id: 'user-1',
          email: 'user@example.com',
          user_metadata: { role: 'customer' },
        },
      },
    });

    const result = await getAdminCategoryTreeAction();
    expect(result.success).toBe(false);
    expect(result.error).toContain('관리자 권한');
  });

  it('getAdminCategoryTreeAction: 카테고리 트리를 정상 반환한다', async () => {
    const rootCat = Category.create(
      { name: '의류', slug: 'clothing', depth: 1, sortOrder: 1, isActive: true },
      'cat-1'
    ).getValue();
    mockFindAll.mockResolvedValueOnce([rootCat]);

    const result = await getAdminCategoryTreeAction();
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data?.[0].name).toBe('의류');
  });

  it('createCategoryAction: 카테고리를 정상 등록한다', async () => {
    mockFindBySlug.mockResolvedValueOnce(null);
    mockSave.mockResolvedValueOnce(undefined);

    const result = await createCategoryAction({
      name: '신발',
      slug: 'shoes',
      isActive: true,
      sortOrder: 1,
    });

    expect(result.success).toBe(true);
    expect(result.data?.name).toBe('신발');
    expect(mockSave).toHaveBeenCalled();
  });

  it('updateCategoryAction: 카테고리를 정상 수정한다', async () => {
    const cat = Category.create(
      { name: '신발', slug: 'shoes', depth: 1, sortOrder: 1, isActive: true },
      'cat-shoes'
    ).getValue();
    mockFindById.mockResolvedValueOnce(cat);
    mockUpdate.mockResolvedValueOnce(undefined);

    const result = await updateCategoryAction({
      id: 'cat-shoes',
      name: '신발/스니커즈',
    });

    expect(result.success).toBe(true);
    expect(result.data?.name).toBe('신발/스니커즈');
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('toggleCategoryStatusAction: 노출 상태를 정상 변경한다', async () => {
    const cat = Category.create(
      { name: '신발', slug: 'shoes', depth: 1, sortOrder: 1, isActive: true },
      'cat-shoes'
    ).getValue();
    mockFindById.mockResolvedValueOnce(cat);
    mockUpdate.mockResolvedValueOnce(undefined);

    const result = await toggleCategoryStatusAction('cat-shoes', false);
    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('deleteCategoryAction: 하위 카테고리가 없으면 삭제한다', async () => {
    const cat = Category.create(
      { name: '신발', slug: 'shoes', depth: 1, sortOrder: 1, isActive: true },
      'cat-shoes'
    ).getValue();
    mockFindById.mockResolvedValueOnce(cat);
    mockFindByParentId.mockResolvedValueOnce([]);
    mockDelete.mockResolvedValueOnce(undefined);

    const result = await deleteCategoryAction('cat-shoes');
    expect(result.success).toBe(true);
    expect(mockDelete).toHaveBeenCalledWith('cat-shoes');
  });

  it('reorderCategoriesAction: 순서를 정상 업데이트한다', async () => {
    const cat = Category.create(
      { name: '신발', slug: 'shoes', depth: 1, sortOrder: 1, isActive: true },
      'cat-shoes'
    ).getValue();
    mockFindById.mockResolvedValue(cat);
    mockUpdate.mockResolvedValue(undefined);

    const result = await reorderCategoriesAction([
      { id: 'cat-shoes', sortOrder: 5 },
    ]);

    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();
  });
});

