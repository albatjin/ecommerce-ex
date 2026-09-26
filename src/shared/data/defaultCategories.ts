import type { CategoryTreeNode } from '@/core/application/catalog/dtos/CategoryTreeDTO';

export interface FlatCategoryOption {
  id: string;
  name: string;
  displayName: string;
  depth: number;
  slug: string;
  parentId: string | null;
}

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const DEFAULT_CATEGORIES: CategoryTreeNode[] = [
  {
    id: 'a0000000-0000-4000-8000-000000000001',
    name: '패션의류/잡화',
    slug: 'fashion',
    depth: 1,
    sortOrder: 1,
    parentId: null,
    children: [
      {
        id: 'a0000000-0000-4000-8000-000000000002',
        name: '여성의류',
        slug: 'women-fashion',
        depth: 2,
        sortOrder: 1,
        parentId: 'a0000000-0000-4000-8000-000000000001',
        children: [
          { id: 'a0000000-0000-4000-8000-000000000003', name: '코트/자켓', slug: 'women-coats', depth: 3, sortOrder: 1, parentId: 'a0000000-0000-4000-8000-000000000002', children: [] },
          { id: 'a0000000-0000-4000-8000-000000000004', name: '니트/가디건', slug: 'women-knits', depth: 3, sortOrder: 2, parentId: 'a0000000-0000-4000-8000-000000000002', children: [] },
          { id: 'a0000000-0000-4000-8000-000000000005', name: '원피스', slug: 'women-dresses', depth: 3, sortOrder: 3, parentId: 'a0000000-0000-4000-8000-000000000002', children: [] },
        ],
      },
      {
        id: 'a0000000-0000-4000-8000-000000000006',
        name: '남성의류',
        slug: 'men-fashion',
        depth: 2,
        sortOrder: 2,
        parentId: 'a0000000-0000-4000-8000-000000000001',
        children: [
          { id: 'a0000000-0000-4000-8000-000000000007', name: '아우터', slug: 'men-outer', depth: 3, sortOrder: 1, parentId: 'a0000000-0000-4000-8000-000000000006', children: [] },
          { id: 'a0000000-0000-4000-8000-000000000008', name: '셔츠/남방', slug: 'men-shirts', depth: 3, sortOrder: 2, parentId: 'a0000000-0000-4000-8000-000000000006', children: [] },
        ],
      },
      {
        id: 'a0000000-0000-4000-8000-000000000009',
        name: '패션잡화/슈즈',
        slug: 'fashion-accessories',
        depth: 2,
        sortOrder: 3,
        parentId: 'a0000000-0000-4000-8000-000000000001',
        children: [
          { id: 'a0000000-0000-4000-8000-000000000010', name: '스니커즈/구두', slug: 'shoes', depth: 3, sortOrder: 1, parentId: 'a0000000-0000-4000-8000-000000000009', children: [] },
          { id: 'a0000000-0000-4000-8000-000000000011', name: '가방/지갑', slug: 'bags', depth: 3, sortOrder: 2, parentId: 'a0000000-0000-4000-8000-000000000009', children: [] },
        ],
      },
    ],
  },
  {
    id: 'a0000000-0000-4000-8000-000000000020',
    name: '디지털/가전',
    slug: 'digital',
    depth: 1,
    sortOrder: 2,
    parentId: null,
    children: [
      {
        id: 'a0000000-0000-4000-8000-000000000021',
        name: '스마트폰/태블릿',
        slug: 'mobile-devices',
        depth: 2,
        sortOrder: 1,
        parentId: 'a0000000-0000-4000-8000-000000000020',
        children: [],
      },
      {
        id: 'a0000000-0000-4000-8000-000000000022',
        name: '음향가전',
        slug: 'audio',
        depth: 2,
        sortOrder: 2,
        parentId: 'a0000000-0000-4000-8000-000000000020',
        children: [],
      },
      {
        id: 'a0000000-0000-4000-8000-000000000023',
        name: 'PC/주변기기',
        slug: 'computer',
        depth: 2,
        sortOrder: 3,
        parentId: 'a0000000-0000-4000-8000-000000000020',
        children: [],
      },
    ],
  },
  {
    id: 'a0000000-0000-4000-8000-000000000030',
    name: '홈/리빙/인테리어',
    slug: 'living',
    depth: 1,
    sortOrder: 3,
    parentId: null,
    children: [
      {
        id: 'a0000000-0000-4000-8000-000000000031',
        name: '디자인가구',
        slug: 'furniture',
        depth: 2,
        sortOrder: 1,
        parentId: 'a0000000-0000-4000-8000-000000000030',
        children: [],
      },
      {
        id: 'a0000000-0000-4000-8000-000000000032',
        name: '홈데코/조명',
        slug: 'home-deco',
        depth: 2,
        sortOrder: 2,
        parentId: 'a0000000-0000-4000-8000-000000000030',
        children: [],
      },
    ],
  },
  {
    id: 'a0000000-0000-4000-8000-000000000040',
    name: '뷰티/스킨케어',
    slug: 'beauty',
    depth: 1,
    sortOrder: 4,
    parentId: null,
    children: [
      {
        id: 'a0000000-0000-4000-8000-000000000041',
        name: '스킨케어',
        slug: 'skincare',
        depth: 2,
        sortOrder: 1,
        parentId: 'a0000000-0000-4000-8000-000000000040',
        children: [],
      },
      {
        id: 'a0000000-0000-4000-8000-000000000042',
        name: '향수/디퓨저',
        slug: 'perfume',
        depth: 2,
        sortOrder: 2,
        parentId: 'a0000000-0000-4000-8000-000000000040',
        children: [],
      },
    ],
  },
  {
    id: 'a0000000-0000-4000-8000-000000000050',
    name: '스포츠/레저',
    slug: 'sports',
    depth: 1,
    sortOrder: 5,
    parentId: null,
    children: [],
  },
  {
    id: 'a0000000-0000-4000-8000-000000000060',
    name: '식품/생필품',
    slug: 'food',
    depth: 1,
    sortOrder: 6,
    parentId: null,
    children: [],
  },
];

/**
 * DEFAULT_CATEGORIES 내에서 ID 또는 Slug로 카테고리 노드를 검색합니다.
 */
export function findDefaultCategoryByIdOrSlug(
  idOrSlug: string,
  tree: CategoryTreeNode[] = DEFAULT_CATEGORIES
): CategoryTreeNode | null {
  for (const node of tree) {
    if (node.id === idOrSlug || node.slug === idOrSlug) {
      return node;
    }
    if (node.children && node.children.length > 0) {
      const found = findDefaultCategoryByIdOrSlug(idOrSlug, node.children);
      if (found) return found;
    }
  }
  return null;
}

/**
 * 문자열(슬러그 또는 임의의 ID)을 유효한 PostgreSQL UUID로 안전하게 변환합니다.
 * - 이미 UUID인 경우 그대로 반환
 * - 'bags', 'fashion' 등 기본 카테고리 슬러그인 경우 대응하는 결정적 UUID 반환
 * - 일치하지 않는 비-UUID 문자열인 경우 PostgreSQL syntax error를 막기 위해 null 반환
 */
export function resolveCategoryUuid(
  idOrSlug?: string | null,
  tree: CategoryTreeNode[] = DEFAULT_CATEGORIES
): string | null {
  if (!idOrSlug || typeof idOrSlug !== 'string') {
    return null;
  }
  const trimmed = idOrSlug.trim();
  if (!trimmed) return null;

  if (UUID_REGEX.test(trimmed)) {
    return trimmed;
  }

  const defaultCat = findDefaultCategoryByIdOrSlug(trimmed, tree);
  if (defaultCat && UUID_REGEX.test(defaultCat.id)) {
    return defaultCat.id;
  }

  return null;
}

/**
 * 트리 구조의 카테고리 노드들을 셀렉트박스 옵션용 단일 배열로 평탄화합니다.
 * 대/중/소 깊이에 따른 직관적인 인덴트와 접두사([대분류], [중분류], [소분류])를 제공합니다.
 */
export function flattenCategoryTree(
  nodes: CategoryTreeNode[],
  depth = 1
): FlatCategoryOption[] {
  const result: FlatCategoryOption[] = [];

  for (const node of nodes) {
    const currentDepth = node.depth || depth;
    const indent = currentDepth === 1 ? '' : '　'.repeat(currentDepth - 1) + '└ ';
    const prefix = currentDepth === 1 ? '[대분류] ' : currentDepth === 2 ? '[중분류] ' : '[소분류] ';

    result.push({
      id: node.id,
      name: node.name,
      displayName: `${indent}${prefix}${node.name}`,
      depth: currentDepth,
      slug: node.slug,
      parentId: node.parentId ?? null,
    });

    if (node.children && node.children.length > 0) {
      result.push(...flattenCategoryTree(node.children, currentDepth + 1));
    }
  }

  return result;
}

/**
 * 특정 카테고리 ID 및 그 모든 하위 카테고리 ID 집합을 반환합니다.
 */
export function getCategoryDescendantIds(
  targetId: string,
  tree: CategoryTreeNode[]
): Set<string> {
  const ids = new Set<string>([targetId]);

  // targetId가 slug인 경우 대응하는 UUID도 함께 포함
  const resolved = resolveCategoryUuid(targetId, tree);
  if (resolved) {
    ids.add(resolved);
  }

  const traverse = (nodes: CategoryTreeNode[]): boolean => {
    for (const node of nodes) {
      if (node.id === targetId || (resolved && node.id === resolved) || node.slug === targetId) {
        ids.add(node.id);
        if (node.slug) ids.add(node.slug);
        collectDescendants(node);
        return true;
      }
      if (node.children && node.children.length > 0) {
        if (traverse(node.children)) return true;
      }
    }
    return false;
  };

  const collectDescendants = (node: CategoryTreeNode) => {
    for (const child of node.children || []) {
      ids.add(child.id);
      if (child.slug) ids.add(child.slug);
      collectDescendants(child);
    }
  };

  traverse(tree);
  return ids;
}
