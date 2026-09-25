import type { CategoryTreeNode } from '@/core/application/catalog/dtos/CategoryTreeDTO';

export interface FlatCategoryOption {
  id: string;
  name: string;
  displayName: string;
  depth: number;
  slug: string;
  parentId: string | null;
}

export const DEFAULT_CATEGORIES: CategoryTreeNode[] = [
  {
    id: 'fashion',
    name: '패션의류/잡화',
    slug: 'fashion',
    depth: 1,
    sortOrder: 1,
    parentId: null,
    children: [
      {
        id: 'women-fashion',
        name: '여성의류',
        slug: 'women-fashion',
        depth: 2,
        sortOrder: 1,
        parentId: 'fashion',
        children: [
          { id: 'women-coats', name: '코트/자켓', slug: 'women-coats', depth: 3, sortOrder: 1, parentId: 'women-fashion', children: [] },
          { id: 'women-knits', name: '니트/가디건', slug: 'women-knits', depth: 3, sortOrder: 2, parentId: 'women-fashion', children: [] },
          { id: 'women-dresses', name: '원피스', slug: 'women-dresses', depth: 3, sortOrder: 3, parentId: 'women-fashion', children: [] },
        ],
      },
      {
        id: 'men-fashion',
        name: '남성의류',
        slug: 'men-fashion',
        depth: 2,
        sortOrder: 2,
        parentId: 'fashion',
        children: [
          { id: 'men-outer', name: '아우터', slug: 'men-outer', depth: 3, sortOrder: 1, parentId: 'men-fashion', children: [] },
          { id: 'men-shirts', name: '셔츠/남방', slug: 'men-shirts', depth: 3, sortOrder: 2, parentId: 'men-fashion', children: [] },
        ],
      },
      {
        id: 'fashion-accessories',
        name: '패션잡화/슈즈',
        slug: 'fashion-accessories',
        depth: 2,
        sortOrder: 3,
        parentId: 'fashion',
        children: [
          { id: 'shoes', name: '스니커즈/구두', slug: 'shoes', depth: 3, sortOrder: 1, parentId: 'fashion-accessories', children: [] },
          { id: 'bags', name: '가방/지갑', slug: 'bags', depth: 3, sortOrder: 2, parentId: 'fashion-accessories', children: [] },
        ],
      },
    ],
  },
  {
    id: 'digital',
    name: '디지털/가전',
    slug: 'digital',
    depth: 1,
    sortOrder: 2,
    parentId: null,
    children: [
      {
        id: 'mobile-devices',
        name: '스마트폰/태블릿',
        slug: 'mobile-devices',
        depth: 2,
        sortOrder: 1,
        parentId: 'digital',
        children: [],
      },
      {
        id: 'audio',
        name: '음향가전',
        slug: 'audio',
        depth: 2,
        sortOrder: 2,
        parentId: 'digital',
        children: [],
      },
      {
        id: 'computer',
        name: 'PC/주변기기',
        slug: 'computer',
        depth: 2,
        sortOrder: 3,
        parentId: 'digital',
        children: [],
      },
    ],
  },
  {
    id: 'living',
    name: '홈/리빙/인테리어',
    slug: 'living',
    depth: 1,
    sortOrder: 3,
    parentId: null,
    children: [
      {
        id: 'furniture',
        name: '디자인가구',
        slug: 'furniture',
        depth: 2,
        sortOrder: 1,
        parentId: 'living',
        children: [],
      },
      {
        id: 'home-deco',
        name: '홈데코/조명',
        slug: 'home-deco',
        depth: 2,
        sortOrder: 2,
        parentId: 'living',
        children: [],
      },
    ],
  },
  {
    id: 'beauty',
    name: '뷰티/스킨케어',
    slug: 'beauty',
    depth: 1,
    sortOrder: 4,
    parentId: null,
    children: [
      {
        id: 'skincare',
        name: '스킨케어',
        slug: 'skincare',
        depth: 2,
        sortOrder: 1,
        parentId: 'beauty',
        children: [],
      },
      {
        id: 'perfume',
        name: '향수/디퓨저',
        slug: 'perfume',
        depth: 2,
        sortOrder: 2,
        parentId: 'beauty',
        children: [],
      },
    ],
  },
  {
    id: 'sports',
    name: '스포츠/레저',
    slug: 'sports',
    depth: 1,
    sortOrder: 5,
    parentId: null,
    children: [],
  },
  {
    id: 'food',
    name: '식품/생필품',
    slug: 'food',
    depth: 1,
    sortOrder: 6,
    parentId: null,
    children: [],
  },
];

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

  const traverse = (nodes: CategoryTreeNode[]): boolean => {
    for (const node of nodes) {
      if (node.id === targetId) {
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
      collectDescendants(child);
    }
  };

  traverse(tree);
  return ids;
}
