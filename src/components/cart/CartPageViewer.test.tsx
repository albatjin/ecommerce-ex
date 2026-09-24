import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CartPageViewer } from './CartPageViewer';
import * as CartContextModule from './CartContext';
import type { CartDTO } from '@/core/application/cart/dtos/CartDTO';

// Mock useRouter
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('CartPageViewer Component', () => {
  const sampleCart: CartDTO = {
    id: 'cart-1',
    userId: null,
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        productName: '오크 다이닝 체어',
        variantName: '월넛',
        price: 85000,
        quantity: 1,
        coverImageUrl: 'https://example.com/chair.jpg',
        shippingFee: 0,
        selected: true,
        subtotal: 85000,
      },
      {
        id: 'item-2',
        productId: 'prod-2',
        productName: '세라믹 머그 2P',
        variantName: '화이트',
        price: 24000,
        quantity: 2,
        coverImageUrl: 'https://example.com/mug.jpg',
        shippingFee: 0,
        selected: true,
        subtotal: 48000,
      },
    ],
    totalItemCount: 3,
    totalProductAmount: 133000,
    totalShippingFee: 0,
    totalPaymentAmount: 133000,
    isAllSelected: true,
    updatedAt: new Date().toISOString(),
  };

  it('장바구니가 비어 있을 경우 안내 화면과 둘러보기 버튼을 표시한다', () => {
    vi.spyOn(CartContextModule, 'useCart').mockReturnValue({
      cart: {
        id: 'cart-empty',
        items: [],
        totalItemCount: 0,
        totalProductAmount: 0,
        totalShippingFee: 0,
        totalPaymentAmount: 0,
        isAllSelected: false,
        updatedAt: new Date().toISOString(),
      },
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

    render(<CartPageViewer />);

    expect(screen.getByText('장바구니가 비어 있습니다')).toBeInTheDocument();
    expect(screen.getByText('인기 상품 둘러보기')).toBeInTheDocument();
  });

  it('품목 리스트, 체크박스, 수량 및 결제 요약 정보를 정확히 렌더링한다', () => {
    const toggleItemMock = vi.fn();
    const updateQuantityMock = vi.fn();
    const removeItemMock = vi.fn();

    vi.spyOn(CartContextModule, 'useCart').mockReturnValue({
      cart: sampleCart,
      isOpen: false,
      isPending: false,
      openDrawer: vi.fn(),
      closeDrawer: vi.fn(),
      toggleDrawer: vi.fn(),
      refreshCart: vi.fn(),
      addToCart: vi.fn(),
      updateQuantity: updateQuantityMock,
      removeItem: removeItemMock,
      toggleItem: toggleItemMock,
      clearCart: vi.fn(),
    });

    render(<CartPageViewer />);

    expect(screen.getByText('오크 다이닝 체어')).toBeInTheDocument();
    expect(screen.getByText('세라믹 머그 2P')).toBeInTheDocument();
    expect(screen.getByText('결제 금액 요약')).toBeInTheDocument();
    expect(screen.getByText('3개 상품 주문하기')).toBeInTheDocument();

    // 전체 선택 버튼 클릭
    const selectAllBtn = screen.getByText(/전체 선택/);
    fireEvent.click(selectAllBtn);
    expect(toggleItemMock).toHaveBeenCalledWith({ selectAll: false });

    // 수량 변경 버튼 클릭
    const plusButtons = screen.getAllByLabelText('수량 증가');
    fireEvent.click(plusButtons[0]);
    expect(updateQuantityMock).toHaveBeenCalledWith('item-1', 2);
  });
});
