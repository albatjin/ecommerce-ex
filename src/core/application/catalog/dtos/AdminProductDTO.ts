import type { ProductStatus, ProductTaxType } from '@/shared/types/database.types';

export interface CreateProductInputDTO {
  nameKo: string;
  nameEn?: string | null;
  categoryId?: string | null;
  regularPrice: number;
  salePrice: number;
  stockQuantity: number;
  taxType?: ProductTaxType;
  maxOrderQuantity?: number;
  brandName?: string | null;
  manufacturer?: string | null;
  description?: string | null;
  coverImageUrl?: string | null;
  additionalImages?: string[];
  shippingFee?: number;
  status?: ProductStatus;
}

export interface UpdateProductInputDTO {
  id: string;
  nameKo?: string;
  nameEn?: string | null;
  categoryId?: string | null;
  regularPrice?: number;
  salePrice?: number;
  stockQuantity?: number;
  taxType?: ProductTaxType;
  maxOrderQuantity?: number;
  brandName?: string | null;
  manufacturer?: string | null;
  description?: string | null;
  coverImageUrl?: string | null;
  additionalImages?: string[];
  shippingFee?: number;
  status?: ProductStatus;
}

export interface ToggleProductStatusDTO {
  id: string;
  status: ProductStatus;
}
