import { Category } from '@/core/domain/catalog/entities/Category';
import type { Database } from '@/shared/types/database.types';

type CategoryRow = Database['public']['Tables']['categories']['Row'];
type CategoryInsert = Database['public']['Tables']['categories']['Insert'];
type CategoryUpdate = Database['public']['Tables']['categories']['Update'];

/**
 * 카테고리 DB Row ↔ Domain Entity 매퍼
 */
export class CategoryMapper {
  /**
   * Supabase DB Row를 Domain Category 엔티티로 변환
   */
  public static toDomain(row: CategoryRow): Category {
    const result = Category.create(
      {
        name: row.name,
        slug: row.slug,
        parentId: row.parent_id,
        depth: row.depth,
        sortOrder: row.sort_order,
        isActive: row.is_active,
        createdAt: new Date(row.created_at),
      },
      row.id
    );

    if (result.isFailure) {
      throw new Error(`Failed to map CategoryRow to Domain: ${result.getError().message}`);
    }

    return result.getValue();
  }

  /**
   * Domain Category 엔티티를 DB Insert 데이터로 변환
   */
  public static toPersistence(category: Category): CategoryInsert {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      parent_id: category.parentId ?? null,
      depth: category.depth,
      sort_order: category.sortOrder,
      is_active: category.isActive,
      created_at: category.createdAt.toISOString(),
    };
  }

  /**
   * Domain Category 엔티티를 DB Update 데이터로 변환
   */
  public static toUpdatePersistence(category: Category): CategoryUpdate {
    return {
      name: category.name,
      slug: category.slug,
      parent_id: category.parentId ?? null,
      depth: category.depth,
      sort_order: category.sortOrder,
      is_active: category.isActive,
    };
  }
}

