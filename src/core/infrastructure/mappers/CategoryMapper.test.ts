import { describe, it, expect } from 'vitest';
import { CategoryMapper } from './CategoryMapper';
import { Category } from '@/core/domain/catalog/entities/Category';
import type { Database } from '@/shared/types/database.types';

type CategoryRow = Database['public']['Tables']['categories']['Row'];

describe('CategoryMapper', () => {
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

  it('toDomain: DB Row를 Category 엔티티로 정상 변환한다', () => {
    const category = CategoryMapper.toDomain(sampleRow);

    expect(category.id).toBe('cat-uuid-1');
    expect(category.name).toBe('아우터');
    expect(category.slug).toBe('outer');
    expect(category.parentId).toBeNull();
    expect(category.depth).toBe(1);
    expect(category.sortOrder).toBe(10);
    expect(category.isActive).toBe(true);
    expect(category.isRoot()).toBe(true);
  });

  it('toPersistence: Category 엔티티를 DB Insert 데이터로 변환한다', () => {
    const category = CategoryMapper.toDomain(sampleRow);
    const insertData = CategoryMapper.toPersistence(category);

    expect(insertData).toEqual({
      id: 'cat-uuid-1',
      name: '아우터',
      slug: 'outer',
      parent_id: null,
      depth: 1,
      sort_order: 10,
      is_active: true,
      created_at: '2026-01-01T00:00:00.000Z',
    });
  });

  it('toUpdatePersistence: Category 엔티티를 DB Update 데이터로 변환한다', () => {
    const category = CategoryMapper.toDomain(sampleRow);
    category.update({ name: '패딩/코트' });
    const updateData = CategoryMapper.toUpdatePersistence(category);

    expect(updateData.name).toBe('패딩/코트');
    expect(updateData.slug).toBe('outer');
    expect(updateData.parent_id).toBeNull();
  });
});
