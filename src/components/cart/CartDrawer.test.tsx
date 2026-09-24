import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CartDrawer } from './CartDrawer';
import * as CartContextModule from './CartContext';
import type { CartDTO } from '@/core/application/cart/dtos/CartDTO';

// Mock useRouter
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('CartDrawer Component', () => {
  const sampleCart: CartDTO = {
    id: 'cart-1',
    userId: null,
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        productName: '캐시미어 니트',
        variantName: '블랙 / L',
        price: 50000,
        quantity: 2,
        coverImageUrl: 'https://example.com/knit.jpg',
        shippingFee: 0,
        selected: true,
        subtotal: 100000,
      },
    ],
    totalItemCount: 2,
    totalProductAmount: 100000,
    totalShippingFee: 0,
    totalPaymentAmount: 100000,
    isAllSelected: true,
    updatedAt: new Date().toISOString(),
  };

  it('isOpen이 false이면 렌더링되지 않는다', () => {
    vi.spyOn(CartContextModule, 'useCart').mockReturnValue({
      cart: sampleCart,
      isOpen: false,
      isPending: false,
      openDrawer: vi.fn(),
      closeDrawer: vi.fn(),
      toggleDrawer: vi.fn(),
      refreshCart: vi.fn(),
      addToCart: vi.fn(),
      updateQuantity: vi.fn(),
      removeItem: vi.fn(),
      toggleItem: vi.fn(),
      clearCart: vi.fn(),
    });

    const { container } = render(<CartDrawer />);
    expect(container).toBeEmptyDOMElement();
  });

  it('isOpen이 true이고 품목이 존재할 때 장바구니 항목과 금액을 렌더링한다', () => {
    const closeDrawerMock = vi.fn();
    vi.spyOn(CartContextModule, 'useCart').mockReturnValue({
      cart: sampleCart,
      isOpen: true,
      isPending: false,
      openDrawer: vi.fn(),
      closeDrawer: closeDrawerMock,
      toggleDrawer: vi.fn(),
      refreshCart: vi.fn(),
      addToCart: vi.fn(),
      updateQuantity: vi.fn(),
      removeItem: vi.fn(),
      toggleItem: vi.fn(),
      clearCart: vi.fn(),
    });

    render(<CartDrawer />);

    expect(screen.getByText('장바구니')).toBeInTheDocument();
    expect(screen.getByText('2개')).toBeInTheDocument();
    expect(screen.getByText('캐시미어 니트')).toBeInTheDocument();
    expect(screen.getByText('옵션: 블랙 / L')).toBeInTheDocument();

    // 닫기 버튼 클릭 시 closeDrawer 호출
    const closeBtn = screen.getByLabelText('닫기');
    fireEvent.click(closeBtn);
    expect(closeDrawerMock).toHaveBeenCalledTimes(1);
  });

  it('장바구니가 비어 있을 때 안내 메시지와 쇼핑 계속하기 버튼을 표시한다', () => {
    vi.spyOn(CartContextModule, 'useCart').mockReturnValue({
      cart: {
        id: 'cart-1',
        items: [],
        totalItemCount: 0,
        totalProductAmount: 0,
        totalShippingFee: 0,
        totalPaymentAmount: 0,
        isAllSelected: false,
        updatedAt: new Date().toISOString(),
      },
      isOpen: true,
      isPending: false,
      openDrawer: vi.fn(),
      closeDrawer: vi.fn(),
      toggleDrawer: vi.fn(),
      refreshCart: vi.fn(),
      addToCart: vi.fn(),
      updateQuantity: vi.fn(),
      removeItem: vi.fn(),
      toggleItem: vi.fn(),
      clearCart: vi.fn(),
    });

    render(<CartDrawer />);

    expect(screen.getByText('장바구니가 비어 있습니다.')).toBeInTheDocument();
    expect(screen.getByText('쇼핑 계속하기')).toBeInTheDocument();
  });
});
