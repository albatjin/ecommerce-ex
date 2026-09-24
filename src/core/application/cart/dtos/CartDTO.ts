export interface CartItemDTO {
  id: string;
  productId: string;
  variantId?: string | null;
  productName: string;
  variantName?: string | null;
  price: number;
  quantity: number;
  coverImageUrl?: string | null;
  shippingFee: number;
  selected: boolean;
  subtotal: number;
}

export interface CartDTO {
  id: string;
  userId?: string | null;
  items: CartItemDTO[];
  totalItemCount: number;
  totalProductAmount: number;
  totalShippingFee: number;
  totalPaymentAmount: number;
  isAllSelected: boolean;
  updatedAt: string;
}

export interface AddToCartInput {
  cartIdOrUserId: string;
  productId: string;
  variantId?: string | null;
  productName: string;
  variantName?: string | null;
  price: number;
  quantity: number;
  coverImageUrl?: string | null;
  shippingFee?: number;
}

export interface UpdateCartItemQuantityInput {
  cartIdOrUserId: string;
  itemId: string;
  quantity: number;
}

export interface RemoveCartItemInput {
  cartIdOrUserId: string;
  itemId?: string;
  selectedOnly?: boolean;
}

export interface ToggleCartItemInput {
  cartIdOrUserId: string;
  itemId?: string;
  selectAll?: boolean;
  selected?: boolean;
}

export interface MergeCartInput {
  guestCartId: string;
  userCartId: string;
}

