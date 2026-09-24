import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductDetailViewer } from './ProductDetailViewer';
import type { ProductDetailDTO } from '@/core/application/catalog/dtos/ProductDetailDTO';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('ProductDetailViewer', () => {
  const sampleDetail: ProductDetailDTO = {
    id: 'prod-detail-1',
    productCode: 'PROD-001',
    nameKo: '프리미엄 캐시미어 니트',
    nameEn: 'Premium Cashmere Knit',
    categoryId: 'cat-knit',
    categoryName: '니트/가디건',
    categorySlug: 'knits',
    regularPrice: 120000,
    salePrice: 100000,
    discountRate: 17,
    taxType: 'TAXABLE',
    maxOrderQuantity: 5,
    stockQuantity: 20,
    safetyStock: 3,
    status: 'ACTIVE',
    isOrderable: true,
    brandName: 'Studio Minimal',
    description: '100% 몽골산 캐시미어로 제작된 최고급 니트입니다.',
    coverImageUrl: 'https://example.com/knit.jpg',
    additionalImages: ['https://example.com/knit-detail.jpg'],
    shippingFee: 3000,
    variants: [
      {
        id: 'var-1',
        skuCode: 'KNIT-BLK-M',
        variantName: '블랙 / M',
        options: { color: 'Black', size: 'M' },
        additionalPrice: 0,
        stockQuantity: 10,
        status: 'ACTIVE',
        isAvailable: true,
      },
      {
        id: 'var-2',
        skuCode: 'KNIT-BEG-L',
        variantName: '베이지 / L',
        options: { color: 'Beige', size: 'L' },
        additionalPrice: 5000,
        stockQuantity: 10,
        status: 'ACTIVE',
        isAvailable: true,
      },
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  };

  it('상품명, 가격, 브랜드, 배송비, 적립금 혜택이 정상 렌더링된다', () => {
    render(<ProductDetailViewer product={sampleDetail} />);

    expect(screen.getByText('프리미엄 캐시미어 니트')).toBeInTheDocument();
    expect(screen.getByText('Studio Minimal')).toBeInTheDocument();
    expect(screen.getAllByText('100,000').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('120,000원')).toBeInTheDocument();
    expect(screen.getByText(/3,000원/)).toBeInTheDocument();
    expect(screen.getByText(/1,000P/)).toBeInTheDocument(); // 1% of 100,000
  });

  it('수량 증가/감소 버튼 클릭 시 총 금액이 실시간으로 갱신된다', () => {
    render(<ProductDetailViewer product={sampleDetail} />);

    // 초기 1개일 때 100,000원
    const plusBtn = screen.getByRole('button', { name: '수량 증가' });
    fireEvent.click(plusBtn);

    // 2개일 때 200,000원
    expect(screen.getByText('200,000')).toBeInTheDocument();

    const minusBtn = screen.getByRole('button', { name: '수량 감소' });
    fireEvent.click(minusBtn);
    expect(screen.getAllByText('100,000').length).toBeGreaterThanOrEqual(1);
  });

  it('옵션 변경 시 추가 금액이 총 결제금액에 반영된다', () => {
    render(<ProductDetailViewer product={sampleDetail} />);

    const select = screen.getByLabelText(/옵션 선택/i);
    // var-2 선택 (추가금 5,000원)
    fireEvent.change(select, { target: { value: 'var-2' } });

    // 100,000 + 5,000 = 105,000원
    expect(screen.getByText('105,000')).toBeInTheDocument();
  });

  it('장바구니 담기 및 바로 구매하기 버튼 클릭 시 콜백이 호출된다', () => {
    const handleAddToCart = vi.fn();
    const handleBuyNow = vi.fn();

    render(
      <ProductDetailViewer
        product={sampleDetail}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
      />
    );

    const cartBtn = screen.getByRole('button', { name: /장바구니 담기/i });
    const buyBtn = screen.getByRole('button', { name: /바로 구매하기/i });

    fireEvent.click(cartBtn);
    expect(handleAddToCart).toHaveBeenCalledWith('prod-detail-1', 'var-1', 1);

    fireEvent.click(buyBtn);
    expect(handleBuyNow).toHaveBeenCalledWith('prod-detail-1', 'var-1', 1);
  });
});
