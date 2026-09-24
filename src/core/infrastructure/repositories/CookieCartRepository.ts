import { cookies } from 'next/headers';
import type { ICartRepository } from '../../domain/cart/repositories/ICartRepository';
import { Cart } from '../../domain/cart/entities/Cart';
import { CartItem } from '../../domain/cart/entities/CartItem';
import { Money } from '../../domain/catalog/value-objects/Money';

export interface CookieAdapter {
  get(name: string): { value: string } | undefined;
  set(name: string, value: string, options?: unknown): void;
  delete(name: string): void;
}

interface SerializedCartItem {
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
}

interface SerializedCart {
  id: string;
  userId?: string | null;
  items: SerializedCartItem[];
  updatedAt: string;
}

export const CART_COOKIE_KEY_PREFIX = 'ecommerce_cart_';

export class CookieCartRepository implements ICartRepository {
  constructor(private readonly customCookieStore?: CookieAdapter | Promise<CookieAdapter>) {}

  private async getCookieStore(): Promise<CookieAdapter> {
    if (this.customCookieStore) {
      return await this.customCookieStore;
    }
    return (await cookies()) as unknown as CookieAdapter;
  }

  private getCookieName(cartIdOrUserId: string): string {
    return `${CART_COOKIE_KEY_PREFIX}${cartIdOrUserId}`;
  }

  public async getCart(cartIdOrUserId: string): Promise<Cart> {
    try {
      const cookieStore = await this.getCookieStore();
      const cookieName = this.getCookieName(cartIdOrUserId);
      const cookie = cookieStore.get(cookieName);

      if (!cookie?.value) {
        return Cart.create(
          { userId: cartIdOrUserId.startsWith('user_') ? cartIdOrUserId : null, items: [] },
          cartIdOrUserId
        ).getValue();
      }

      const parsed: SerializedCart = JSON.parse(cookie.value);
      const items: CartItem[] = [];

      for (const itemData of parsed.items || []) {
        const itemResult = CartItem.create(
          {
            productId: itemData.productId,
            variantId: itemData.variantId ?? null,
            productName: itemData.productName,
            variantName: itemData.variantName ?? null,
            price: Money.create(itemData.price),
            quantity: itemData.quantity,
            coverImageUrl: itemData.coverImageUrl ?? null,
            shippingFee: Money.create(itemData.shippingFee),
            selected: itemData.selected,
          },
          itemData.id
        );
        if (itemResult.isSuccess) {
          items.push(itemResult.getValue());
        }
      }

      return Cart.create(
        {
          userId: parsed.userId ?? null,
          items,
          updatedAt: parsed.updatedAt ? new Date(parsed.updatedAt) : new Date(),
        },
        parsed.id || cartIdOrUserId
      ).getValue();
    } catch {
      return Cart.create(
        { userId: cartIdOrUserId.startsWith('user_') ? cartIdOrUserId : null, items: [] },
        cartIdOrUserId
      ).getValue();
    }
  }

  public async saveCart(cart: Cart): Promise<void> {
    try {
      const cookieStore = await this.getCookieStore();
      const cookieName = this.getCookieName(cart.id);

      const serialized: SerializedCart = {
        id: cart.id,
        userId: cart.userId ?? null,
        items: cart.items.map((i) => ({
          id: i.id,
          productId: i.productId,
          variantId: i.variantId ?? null,
          productName: i.productName,
          variantName: i.variantName ?? null,
          price: i.price.amount,
          quantity: i.quantity,
          coverImageUrl: i.coverImageUrl ?? null,
          shippingFee: i.shippingFee.amount,
          selected: i.selected,
        })),
        updatedAt: cart.updatedAt.toISOString(),
      };

      cookieStore.set(cookieName, JSON.stringify(serialized), {
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    } catch (error) {
      console.error('Failed to save cart to cookies:', error);
    }
  }

  public async clearCart(cartIdOrUserId: string): Promise<void> {
    try {
      const cookieStore = await this.getCookieStore();
      const cookieName = this.getCookieName(cartIdOrUserId);
      cookieStore.delete(cookieName);
    } catch (error) {
      console.error('Failed to clear cart cookie:', error);
    }
  }
}
