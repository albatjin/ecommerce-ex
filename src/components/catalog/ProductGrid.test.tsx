import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductGrid } from './ProductGrid';
import type { ProductSummaryDTO } from '@/core/application/catalog/dtos/GetProductsDTO';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => '/products',
  useSearchParams: () => new URLSearchParams(),
}));

describe('ProductGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const sampleProducts: ProductSummaryDTO[] = [
    {
      id: 'prod-1',
      productCode: 'PROD-001',
      nameKo: '린넨 셔츠',
      regularPrice: 40000,
      salePrice: 40000,
      discountRate: 0,
      taxType: 'TAXABLE',
      status: 'ACTIVE',
      stockQuantity: 10,
      isOrderable: true,
      shippingFee: 3000,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'prod-2',
      productCode: 'PROD-002',
      nameKo: '슬랙스 팬츠',
      regularPrice: 60000,
      salePrice: 50000,
      discountRate: 16,
      taxType: 'TAXABLE',
      status: 'ACTIVE',
      stockQuantity: 5,
      isOrderable: true,
      shippingFee: 0,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  it('상품 목록과 페이지네이션을 정상 렌더링하고 onPageChange가 있으면 호출한다', () => {
    const handlePageChange = vi.fn();

    render(
      <ProductGrid
        products={sampleProducts}
        totalCount={30}
        currentPage={1}
        totalPages={3}
        onPageChange={handlePageChange}
      />
    );

    expect(screen.getByText('린넨 셔츠')).toBeInTheDocument();
    expect(screen.getByText('슬랙스 팬츠')).toBeInTheDocument();

    const page2Btn = screen.getByRole('button', { name: '2' });
    expect(page2Btn).toBeInTheDocument();
    fireEvent.click(page2Btn);
    expect(handlePageChange).toHaveBeenCalledWith(2);
  });

  it('onPageChange가 없을 때는 router.push로 URL query 파라미터를 갱신한다', () => {
    render(
      <ProductGrid
        products={sampleProducts}
        totalCount={30}
        currentPage={1}
        totalPages={3}
      />
    );

    const page3Btn = screen.getByRole('button', { name: '3' });
    fireEvent.click(page3Btn);
    expect(pushMock).toHaveBeenCalledWith('/products?page=3');
  });

  it('상품이 없을 때 빈 화면 안내를 렌더링한다', () => {
    render(
      <ProductGrid
        products={[]}
        totalCount={0}
        currentPage={1}
        totalPages={0}
      />
    );

    expect(screen.getByText('일치하는 상품이 없습니다')).toBeInTheDocument();
    expect(screen.getByText('전체 상품 보기')).toBeInTheDocument();
  });
});
