import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getCartAction,
  addToCartAction,
  updateCartItemQuantityAction,
  removeCartItemAction,
  toggleCartItemAction,
} from './cart.actions';

// Mock cookies
const mockCookieMap = new Map<string, string>();
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: (key: string) => {
      const v = mockCookieMap.get(key);
      return v !== undefined ? { value: v } : undefined;
    },
    set: (key: string, value: string) => {
      mockCookieMap.set(key, value);
    },
    delete: (key: string) => {
      mockCookieMap.delete(key);
    },
  })),
}));

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock Supabase Server Client
vi.mock('@/core/infrastructure/supabase/server', () => ({
  getServerClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: null },
      })),
    },
  })),
}));

describe('cart.actions (Server Actions)', () => {
  beforeEach(() => {
    mockCookieMap.clear();
    vi.clearAllMocks();
  });

  it('getCartAction: 세션 장바구니를 정상 조회한다', async () => {
    const result = await getCartAction();

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.items).toHaveLength(0);
    expect(result.data?.totalProductAmount).toBe(0);
  });

  it('addToCartAction: 장바구니에 새 품목을 추가한다', async () => {
    const result = await addToCartAction({
      productId: 'prod_1',
      productName: '프리미엄 셔츠',
      price: 49000,
      quantity: 1,
      shippingFee: 3000,
    });

    expect(result.success).toBe(true);
    expect(result.data?.items).toHaveLength(1);
    expect(result.data?.items[0].productName).toBe('프리미엄 셔츠');
    expect(result.data?.totalProductAmount).toBe(49000);
    // 5만원 미만이므로 배송비 3,000원
    expect(result.data?.totalShippingFee).toBe(3000);
    expect(result.data?.totalPaymentAmount).toBe(52000);
  });

  it('updateCartItemQuantityAction: 품목 수량을 변경하고 금액을 재계산한다', async () => {
    const addResult = await addToCartAction({
      productId: 'prod_1',
      productName: '프리미엄 셔츠',
      price: 49000,
      quantity: 1,
    });
    const itemId = addResult.data!.items[0].id;

    const updateResult = await updateCartItemQuantityAction(itemId, 2);
    expect(updateResult.success).toBe(true);
    expect(updateResult.data?.items[0].quantity).toBe(2);
    // 49,000 * 2 = 98,000원 -> 무료 배송(0원)
    expect(updateResult.data?.totalProductAmount).toBe(98000);
    expect(updateResult.data?.totalShippingFee).toBe(0);
    expect(updateResult.data?.totalPaymentAmount).toBe(98000);
  });

  it('removeCartItemAction: 품목 삭제를 처리한다', async () => {
    const addResult = await addToCartAction({
      productId: 'prod_1',
      productName: '프리미엄 셔츠',
      price: 49000,
      quantity: 1,
    });
    const itemId = addResult.data!.items[0].id;

    const removeResult = await removeCartItemAction({ itemId });
    expect(removeResult.success).toBe(true);
    expect(removeResult.data?.items).toHaveLength(0);
  });

  it('toggleCartItemAction: 선택 여부를 토글한다', async () => {
    const addResult = await addToCartAction({
      productId: 'prod_1',
      productName: '프리미엄 셔츠',
      price: 49000,
      quantity: 1,
    });
    const itemId = addResult.data!.items[0].id;

    const toggleResult = await toggleCartItemAction({ itemId, selected: false });
    expect(toggleResult.success).toBe(true);
    expect(toggleResult.data?.items[0].selected).toBe(false);
    expect(toggleResult.data?.totalProductAmount).toBe(0);
  });
});

