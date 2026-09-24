import { describe, it, expect, vi } from 'vitest';
import {
  CookieCartRepository,
  CART_COOKIE_KEY_PREFIX,
  type CookieAdapter,
} from './CookieCartRepository';
import { Cart } from '../../domain/cart/entities/Cart';
import { CartItem } from '../../domain/cart/entities/CartItem';
import { Money } from '../../domain/catalog/value-objects/Money';

describe('CookieCartRepository', () => {
  const createMockCookieStore = (initialCookies: Record<string, string> = {}): CookieAdapter => {
    const store = new Map<string, string>(Object.entries(initialCookies));
    return {
      get: vi.fn((name: string) => {
        const val = store.get(name);
        return val !== undefined ? { value: val } : undefined;
      }),
      set: vi.fn((name: string, value: string) => {
        store.set(name, value);
      }),
      delete: vi.fn((name: string) => {
        store.delete(name);
      }),
    };
  };

  it('쿠키가 없을 경우 빈 Cart를 반환한다', async () => {
    const mockStore = createMockCookieStore();
    const repo = new CookieCartRepository(mockStore);

    const cart = await repo.getCart('guest_123');
    expect(cart.items).toHaveLength(0);
    expect(cart.id).toBe('guest_123');
  });

  it('saveCart 호출 시 장바구니 데이터를 JSON 직렬화하여 쿠키에 저장한다', async () => {
    const mockStore = createMockCookieStore();
    const repo = new CookieCartRepository(mockStore);

    const cart = Cart.create({ userId: 'user_1' }, 'cart_1').getValue();
    const item = CartItem.create({
      productId: 'prod_1',
      productName: '테스트 상품',
      price: Money.create(25000),
      quantity: 2,
      shippingFee: Money.create(3000),
    }).getValue();
    cart.addItem(item);

    await repo.saveCart(cart);

    expect(mockStore.set).toHaveBeenCalledWith(
      `${CART_COOKIE_KEY_PREFIX}cart_1`,
      expect.stringContaining('테스트 상품'),
      expect.objectContaining({ maxAge: 2592000 })
    );
  });

  it('쿠키에 저장된 장바구니 데이터를 정상적으로 역직렬화하여 Cart 엔티티로 복원한다', async () => {
    const initialData = {
      id: 'cart_1',
      userId: 'user_1',
      items: [
        {
          id: 'item_1',
          productId: 'prod_1',
          variantId: 'var_1',
          productName: '복원된 상품',
          variantName: '화이트 / M',
          price: 45000,
          quantity: 2,
          shippingFee: 3000,
          selected: true,
        },
      ],
      updatedAt: new Date().toISOString(),
    };

    const mockStore = createMockCookieStore({
      [`${CART_COOKIE_KEY_PREFIX}cart_1`]: JSON.stringify(initialData),
    });
    const repo = new CookieCartRepository(mockStore);

    const cart = await repo.getCart('cart_1');
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].productName).toBe('복원된 상품');
    expect(cart.items[0].price.amount).toBe(45000);
    expect(cart.items[0].quantity).toBe(2);
    expect(cart.items[0].subtotal().amount).toBe(90000);
  });

  it('clearCart 호출 시 해당 장바구니 쿠키를 삭제한다', async () => {
    const mockStore = createMockCookieStore({
      [`${CART_COOKIE_KEY_PREFIX}cart_1`]: '{"id":"cart_1","items":[]}',
    });
    const repo = new CookieCartRepository(mockStore);

    await repo.clearCart('cart_1');
    expect(mockStore.delete).toHaveBeenCalledWith(`${CART_COOKIE_KEY_PREFIX}cart_1`);
  });
});
