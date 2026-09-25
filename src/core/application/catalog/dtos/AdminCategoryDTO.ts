export interface AdminCategoryNodeDTO {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  depth: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  children: AdminCategoryNodeDTO[];
}

export interface CreateCategoryInputDTO {
  name: string;
  slug: string;
  parentId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryInputDTO {
  id: string;
  name?: string;
  slug?: string;
  parentId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface ReorderCategoryItemDTO {
  id: string;
  sortOrder: number;
}
