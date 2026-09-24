import type { Product } from '../entities/Product';
import type { ProductStatus } from '@/shared/types/database.types';

export interface ProductFilterOptions {
  categoryId?: string;
  status?: ProductStatus;
  searchQuery?: string;
  minPrice?: number;
  maxPrice?: number;
  hasDiscount?: boolean;
  sortBy?: 'created_at' | 'price_asc' | 'price_desc' | 'popular';
  limit?: number;
  offset?: number;
}

export interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  findByProductCode(productCode: string): Promise<Product | null>;
  findMany(options?: ProductFilterOptions): Promise<{ products: Product[]; totalCount: number }>;
  save(product: Product): Promise<void>;
  update(product: Product): Promise<void>;
  delete(id: string): Promise<void>;
}
