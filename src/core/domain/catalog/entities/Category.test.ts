import { describe, it, expect } from 'vitest';
import { Category } from './Category';

describe('Category Entity', () => {
  it('대분류 카테고리를 정상 생성한다 (parentId 없음)', () => {
    const result = Category.create({
      name: '패션의류',
      slug: 'fashion',
      depth: 1,
      sortOrder: 0,
      isActive: true,
    });

    expect(result.isSuccess).toBe(true);
    const category = result.getValue();
    expect(category.isRoot()).toBe(true);
    expect(category.depth).toBe(1);
    expect(category.name).toBe('패션의류');
  });

  it('중분류 카테고리를 정상 생성한다 (parentId 존재)', () => {
    const parentId = 'cat-root-1';
    const result = Category.create({
      name: '남성의류',
      slug: 'men-fashion',
      parentId,
      depth: 2,
      sortOrder: 1,
      isActive: true,
    });

    expect(result.isSuccess).toBe(true);
    const category = result.getValue();
    expect(category.isRoot()).toBe(false);
    expect(category.parentId).toBe(parentId);
    expect(category.depth).toBe(2);
  });

  it('depth가 1~3 범위를 벗어나면 생성을 거부한다', () => {
    const result = Category.create({
      name: '잘못된카테고리',
      slug: 'invalid',
      depth: 4,
      sortOrder: 0,
      isActive: true,
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError().message).toContain('카테고리 뎁스는 1(대분류), 2(중분류), 3(소분류)');
  });
});
