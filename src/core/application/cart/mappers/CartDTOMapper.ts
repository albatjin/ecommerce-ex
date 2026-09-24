import type { Cart } from '../../../domain/cart/entities/Cart';
import type { CartDTO, CartItemDTO } from '../dtos/CartDTO';

export class CartDTOMapper {
  public static toDTO(cart: Cart): CartDTO {
    const items: CartItemDTO[] = cart.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      variantId: item.variantId ?? null,
      productName: item.productName,
      variantName: item.variantName ?? null,
      price: item.price.amount,
      quantity: item.quantity,
      coverImageUrl: item.coverImageUrl ?? null,
      shippingFee: item.shippingFee.amount,
      selected: item.selected,
      subtotal: item.subtotal().amount,
    }));

    return {
      id: cart.id,
      userId: cart.userId ?? null,
      items,
      totalItemCount: cart.totalItemCount(),
      totalProductAmount: cart.totalProductAmount().amount,
      totalShippingFee: cart.totalShippingFee().amount,
      totalPaymentAmount: cart.totalPaymentAmount().amount,
      isAllSelected: cart.isAllSelected(),
      updatedAt: cart.updatedAt.toISOString(),
    };
  }
}
