import type {
  ProductStatus,
  ProductTaxType,
  VariantStatus,
} from '@/shared/types/database.types';

export interface ProductVariantDetailDTO {
  id: string;
  skuCode: string;
  variantName: string;
  options: Record<string, string>;
  additionalPrice: number;
  stockQuantity: number;
  status: VariantStatus;
  isAvailable: boolean;
}

export interface ProductDetailDTO {
  id: string;
  productCode: string;
  nameKo: string;
  nameEn?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  categorySlug?: string | null;
  regularPrice: number;
  salePrice: number;
  discountRate: number;
  taxType: ProductTaxType;
  maxOrderQuantity: number;
  stockQuantity: number;
  safetyStock: number;
  status: ProductStatus;
  isOrderable: boolean;
  skuCode?: string | null;
  manufacturer?: string | null;
  brandName?: string | null;
  description?: string | null;
  coverImageUrl?: string | null;
  additionalImages: string[];
  shippingFee: number;
  originAddress?: string | null;
  variants: ProductVariantDetailDTO[];
  createdAt: string;
  updatedAt: string;
}

