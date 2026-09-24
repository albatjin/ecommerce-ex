import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCategoryTreeAction } from './catalog.actions';
import { Category } from '@/core/domain/catalog/entities/Category';

// Mock SupabaseCategoryRepository as class
vi.mock('@/core/infrastructure/repositories/SupabaseCategoryRepository', () => {
  return {
    SupabaseCategoryRepository: class {
      async findAllActive() {
        return [
          Category.create(
            {
              name: '의류',
              slug: 'clothing',
              depth: 1,
              sortOrder: 1,
              isActive: true,
            },
            'cat-1'
          ).getValue(),
        ];
      }
    },
  };
});

describe('catalog.actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getCategoryTreeAction: 카테고리 트리를 정상 반환한다', async () => {
    const result = await getCategoryTreeAction();

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data).toHaveLength(1);
    expect(result.data?.[0].name).toBe('의류');
  });
});
