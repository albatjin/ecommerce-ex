import { describe, it, expect, vi } from 'vitest';
import { SupabaseCategoryRepository } from './SupabaseCategoryRepository';
import { Category } from '@/core/domain/catalog/entities/Category';
import type { Database } from '@/shared/types/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';

type CategoryRow = Database['public']['Tables']['categories']['Row'];

describe('SupabaseCategoryRepository', () => {
  const sampleRow: CategoryRow = {
    id: 'cat-uuid-1',
    name: '아우터',
    slug: 'outer',
    parent_id: null,
    depth: 1,
    sort_order: 10,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
  };

  it('findById: 카테고리가 존재하면 Category 엔티티를 반환한다', async () => {
    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: sampleRow, error: null }),
          }),
        }),
      }),
    } as unknown as SupabaseClient<Database>;

    const repo = new SupabaseCategoryRepository(mockClient);
    const category = await repo.findById('cat-uuid-1');

    expect(category).not.toBeNull();
    expect(category?.id).toBe('cat-uuid-1');
    expect(category?.name).toBe('아우터');
    expect(category?.slug).toBe('outer');
  });

  it('findBySlug: 슬러그로 카테고리를 조회한다', async () => {
    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: sampleRow, error: null }),
          }),
        }),
      }),
    } as unknown as SupabaseClient<Database>;

    const repo = new SupabaseCategoryRepository(mockClient);
    const category = await repo.findBySlug('outer');

    expect(category).not.toBeNull();
    expect(category?.slug).toBe('outer');
  });

  it('findAllActive: 활성화된 카테고리 목록을 정렬 순서대로 반환한다', async () => {
    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [sampleRow], error: null }),
          }),
        }),
      }),
    } as unknown as SupabaseClient<Database>;

    const repo = new SupabaseCategoryRepository(mockClient);
    const categories = await repo.findAllActive();

    expect(categories).toHaveLength(1);
    expect(categories[0].name).toBe('아우터');
  });

  it('findByParentId: 부모 카테고리 ID로 하위 카테고리 목록을 조회한다 (null인 경우 루트 조회)', async () => {
    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [sampleRow], error: null }),
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient<Database>;

    const repo = new SupabaseCategoryRepository(mockClient);
    const categories = await repo.findByParentId(null);

    expect(categories).toHaveLength(1);
  });

  it('save & update & delete: 정상 호출 검증', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    const deleteMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    const mockClient = {
      from: vi.fn().mockReturnValue({
        insert: insertMock,
        update: updateMock,
        delete: deleteMock,
      }),
    } as unknown as SupabaseClient<Database>;

    const repo = new SupabaseCategoryRepository(mockClient);
    const category = Category.create({
      name: '상의',
      slug: 'tops',
      depth: 1,
      sortOrder: 1,
      isActive: true,
    }).getValue();

    await repo.save(category);
    expect(insertMock).toHaveBeenCalled();

    await repo.update(category);
    expect(updateMock).toHaveBeenCalled();

    await repo.delete(category.id);
    expect(deleteMock).toHaveBeenCalled();
  });
});

