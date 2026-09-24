import type { ICartRepository } from '../../domain/cart/repositories/ICartRepository';
import { Cart } from '../../domain/cart/entities/Cart';

export class MemoryCartRepository implements ICartRepository {
  private carts: Map<string, Cart> = new Map();

  public async getCart(cartIdOrUserId: string): Promise<Cart> {
    const existing = this.carts.get(cartIdOrUserId);
    if (existing) {
      return existing;
    }
    const newCart = Cart.create({ userId: cartIdOrUserId.startsWith('user_') ? cartIdOrUserId : null }, cartIdOrUserId).getValue();
    this.carts.set(cartIdOrUserId, newCart);
    return newCart;
  }

  public async saveCart(cart: Cart): Promise<void> {
    this.carts.set(cart.id, cart);
  }

  public async clearCart(cartIdOrUserId: string): Promise<void> {
    const cart = Cart.create({ userId: cartIdOrUserId.startsWith('user_') ? cartIdOrUserId : null }, cartIdOrUserId).getValue();
    this.carts.set(cartIdOrUserId, cart);
  }
}

