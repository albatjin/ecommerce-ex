'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useTransition,
  type ReactNode,
} from 'react';
import type { CartDTO, AddToCartInput } from '@/core/application/cart/dtos/CartDTO';
import {
  getCartAction,
  addToCartAction,
  updateCartItemQuantityAction,
  removeCartItemAction,
  toggleCartItemAction,
} from '@/app/actions/cart.actions';

interface CartContextValue {
  cart: CartDTO | null;
  isOpen: boolean;
  isPending: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  refreshCart: () => Promise<void>;
  addToCart: (
    item: Omit<AddToCartInput, 'cartIdOrUserId'>,
    openDrawerAfter?: boolean
  ) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<boolean>;
  removeItem: (options?: { itemId?: string; selectedOnly?: boolean }) => Promise<boolean>;
  toggleItem: (options: {
    itemId?: string;
    selectAll?: boolean;
    selected?: boolean;
  }) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
}

const CartContext = createContext<CartContextValue | null>(null);

interface CartProviderProps {
  children: ReactNode;
  initialCart?: CartDTO | null;
}

export function CartProvider({ children, initialCart = null }: CartProviderProps) {
  const [cart, setCart] = useState<CartDTO | null>(initialCart);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const openDrawer = useCallback(() => setIsOpen(true), []);
  const closeDrawer = useCallback(() => setIsOpen(false), []);
  const toggleDrawer = useCallback(() => setIsOpen((prev) => !prev), []);

  const refreshCart = useCallback(async () => {
    startTransition(async () => {
      const res = await getCartAction();
      if (res.success && res.data) {
        setCart(res.data);
      }
    });
  }, []);

  const addToCart = useCallback(
    async (
      item: Omit<AddToCartInput, 'cartIdOrUserId'>,
      openDrawerAfter = true
    ): Promise<boolean> => {
      return new Promise<boolean>((resolve) => {
        startTransition(async () => {
          const res = await addToCartAction(item);
          if (res.success && res.data) {
            setCart(res.data);
            if (openDrawerAfter) {
              setIsOpen(true);
            }
            resolve(true);
          } else {
            resolve(false);
          }
        });
      });
    },
    []
  );

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number): Promise<boolean> => {
      return new Promise<boolean>((resolve) => {
        startTransition(async () => {
          const res = await updateCartItemQuantityAction(itemId, quantity);
          if (res.success && res.data) {
            setCart(res.data);
            resolve(true);
          } else {
            resolve(false);
          }
        });
      });
    },
    []
  );

  const removeItem = useCallback(
    async (options: { itemId?: string; selectedOnly?: boolean } = {}): Promise<boolean> => {
      return new Promise<boolean>((resolve) => {
        startTransition(async () => {
          const res = await removeCartItemAction(options);
          if (res.success && res.data) {
            setCart(res.data);
            resolve(true);
          } else {
            resolve(false);
          }
        });
      });
    },
    []
  );

  const toggleItem = useCallback(
    async (options: {
      itemId?: string;
      selectAll?: boolean;
      selected?: boolean;
    }): Promise<boolean> => {
      return new Promise<boolean>((resolve) => {
        startTransition(async () => {
          const res = await toggleCartItemAction(options);
          if (res.success && res.data) {
            setCart(res.data);
            resolve(true);
          } else {
            resolve(false);
          }
        });
      });
    },
    []
  );

  const clearCart = useCallback(async (): Promise<boolean> => {
    return removeItem({});
  }, [removeItem]);

  return (
    <CartContext.Provider
      value={{
        cart,
        isOpen,
        isPending,
        openDrawer,
        closeDrawer,
        toggleDrawer,
        refreshCart,
        addToCart,
        updateQuantity,
        removeItem,
        toggleItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    return {
      cart: null,
      isOpen: false,
      isPending: false,
      openDrawer: () => {},
      closeDrawer: () => {},
      toggleDrawer: () => {},
      refreshCart: async () => {},
      addToCart: async () => false,
      updateQuantity: async () => false,
      removeItem: async () => false,
      toggleItem: async () => false,
      clearCart: async () => false,
    };
  }
  return context;
}
