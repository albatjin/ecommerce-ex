import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from './ProductCard';
import type { ProductSummaryDTO } from '@/core/application/catalog/dtos/GetProductsDTO';

describe('ProductCard', () => {
  const sampleProduct: ProductSummaryDTO = {
    id: 'prod-1',
    productCode: 'PROD-001',
    nameKo: '프리미엄 울 캐시미어 코트',
    nameEn: 'Premium Wool Cashmere Coat',
    categoryId: 'cat-1',
    regularPrice: 200000,
    salePrice: 160000,
    discountRate: 20,
    taxType: 'TAXABLE',
    status: 'ACTIVE',
    stockQuantity: 15,
    isOrderable: true,
    brandName: 'Studio Minimal',
    coverImageUrl: 'https://example.com/coat.jpg',
    shippingFee: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  it('상품명, 브랜드, 할인가격, 할인율 배지, 무료배송 태그가 올바르게 렌더링된다', () => {
    render(<ProductCard product={sampleProduct} />);

    expect(screen.getByText('Studio Minimal')).toBeInTheDocument();
    expect(screen.getByText('프리미엄 울 캐시미어 코트')).toBeInTheDocument();
    expect(screen.getByText('160,000')).toBeInTheDocument();
    expect(screen.getByText('200,000원')).toBeInTheDocument();
    expect(screen.getByText(/20% OFF/i)).toBeInTheDocument();
    expect(screen.getByText('무료배송')).toBeInTheDocument();
  });

  it('품절된 상품은 "일시 품절" 오버레이를 표시하고 장바구니 버튼이 비활성화된다', () => {
    const outOfStockProduct: ProductSummaryDTO = {
      ...sampleProduct,
      isOrderable: false,
      status: 'OUT_OF_STOCK',
      stockQuantity: 0,
    };

    render(<ProductCard product={outOfStockProduct} />);

    expect(screen.getByText('일시 품절')).toBeInTheDocument();
    const cartBtn = screen.getByRole('button', { name: /장바구니에 담기/i });
    expect(cartBtn).toBeDisabled();
  });

  it('장바구니 버튼 클릭 시 onAddToCart 핸들러가 호출된다', () => {
    const handleAddToCart = vi.fn();
    render(<ProductCard product={sampleProduct} onAddToCart={handleAddToCart} />);

    const cartBtn = screen.getByRole('button', { name: /장바구니에 담기/i });
    fireEvent.click(cartBtn);

    expect(handleAddToCart).toHaveBeenCalledWith('prod-1');
  });
});
