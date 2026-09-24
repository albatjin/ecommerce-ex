export interface CategoryTreeNode {
  id: string;
  name: string;
  slug: string;
  depth: number;
  sortOrder: number;
  parentId: string | null;
  children: CategoryTreeNode[];
}

