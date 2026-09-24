import type { ProductStatus, ProductTaxType } from '@/shared/types/database.types';

export interface GetProductsQueryDTO {
  categoryId?: string;
  categorySlug?: string;
  status?: ProductStatus;
  searchQuery?: string;
  minPrice?: number;
  maxPrice?: number;
  hasDiscount?: boolean;
  sortBy?: 'created_at' | 'price_asc' | 'price_desc' | 'popular';
  page?: number;
  limit?: number;
}

export interface ProductSummaryDTO {
  id: string;
  productCode: string;
  nameKo: string;
  nameEn?: string | null;
  categoryId?: string | null;
  regularPrice: number;
  salePrice: number;
  discountRate: number;
  taxType: ProductTaxType;
  status: ProductStatus;
  stockQuantity: number;
  isOrderable: boolean;
  brandName?: string | null;
  coverImageUrl?: string | null;
  shippingFee: number;
  createdAt: string;
}

export interface GetProductsResultDTO {
  products: ProductSummaryDTO[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  limit: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
}

