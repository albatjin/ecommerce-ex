import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminProductListViewer } from './AdminProductListViewer';
import type { GetProductsResultDTO, ProductSummaryDTO } from '@/core/application/catalog/dtos/GetProductsDTO';
import type { CategoryTreeNode } from '@/core/application/catalog/dtos/CategoryTreeDTO';

const mockToggleStatusAction = vi.fn();
const mockDeleteProductAction = vi.fn();

vi.mock('@/app/actions/product-admin.actions', () => ({
  toggleProductStatusAction: (...args: unknown[]) => mockToggleStatusAction(...args),
  deleteProductAction: (...args: unknown[]) => mockDeleteProductAction(...args),
  createProductAction: vi.fn(),
  updateProductAction: vi.fn(),
  uploadProductImageAction: vi.fn(),
}));

const mockProducts: ProductSummaryDTO[] = [
  {
    id: 'prod-1',
    nameKo: '프리미엄 무선 헤드폰',
    productCode: 'HP-001',
    regularPrice: 200000,
    salePrice: 150000,
    discountRate: 25,
    taxType: 'TAXABLE',
    stockQuantity: 15,
    isOrderable: true,
    status: 'ACTIVE',
    categoryId: 'cat-electronics',
    coverImageUrl: 'https://example.com/headphone.jpg',
    brandName: 'SoundMaster',
    shippingFee: 3000,
    createdAt: '2026-09-01T00:00:00Z',
  },
  {
    id: 'prod-2',
    nameKo: '스마트 피트니스 워치',
    productCode: 'WT-002',
    regularPrice: 300000,
    salePrice: 300000,
    discountRate: 0,
    taxType: 'TAXABLE',
    stockQuantity: 0,
    isOrderable: false,
    status: 'OUT_OF_STOCK',
    categoryId: 'cat-electronics',
    coverImageUrl: null,
    brandName: 'FitTech',
    shippingFee: 0,
    createdAt: '2026-09-02T00:00:00Z',
  },
  {
    id: 'prod-3',
    nameKo: '오가닉 코튼 티셔츠',
    productCode: 'TS-003',
    regularPrice: 40000,
    salePrice: 32000,
    discountRate: 20,
    taxType: 'TAXABLE',
    stockQuantity: 5,
    isOrderable: true,
    status: 'HIDDEN',
    categoryId: 'cat-fashion',
    coverImageUrl: null,
    brandName: 'EcoWear',
    shippingFee: 2500,
    createdAt: '2026-09-03T00:00:00Z',
  },
];

const mockInitialData: GetProductsResultDTO = {
  products: mockProducts,
  totalCount: 3,
  currentPage: 1,
  limit: 20,
  totalPages: 1,
  hasPrevPage: false,
  hasNextPage: false,
};

const mockCategories: CategoryTreeNode[] = [
  {
    id: 'cat-electronics',
    name: '전자기기',
    slug: 'electronics',
    parentId: null,
    depth: 1,
    sortOrder: 1,
    children: [],
  },
  {
    id: 'cat-fashion',
    name: '패션의류',
    slug: 'fashion',
    parentId: null,
    depth: 1,
    sortOrder: 2,
    children: [],
  },
];

describe('AdminProductListViewer Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('상품 목록과 통계 카드를 올바르게 렌더링한다', () => {
    render(<AdminProductListViewer initialData={mockInitialData} categories={mockCategories} />);

    expect(screen.getByText('상품 통합 관리 (CMS)')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // 전체
    expect(screen.getByText('프리미엄 무선 헤드폰')).toBeInTheDocument();
    expect(screen.getByText('스마트 피트니스 워치')).toBeInTheDocument();
    expect(screen.getByText('오가닉 코튼 티셔츠')).toBeInTheDocument();
  });

  it('상품명이나 코드로 검색 시 일치하는 상품만 필터링된다', () => {
    render(<AdminProductListViewer initialData={mockInitialData} categories={mockCategories} />);

    const searchInput = screen.getByPlaceholderText(/검색/i);
    fireEvent.change(searchInput, { target: { value: 'HP-001' } });

    expect(screen.getByText('프리미엄 무선 헤드폰')).toBeInTheDocument();
    expect(screen.queryByText('스마트 피트니스 워치')).not.toBeInTheDocument();
    expect(screen.queryByText('오가닉 코튼 티셔츠')).not.toBeInTheDocument();
  });

  it('상태 탭(품절)을 클릭하면 해당 상태 상품만 필터링된다', () => {
    render(<AdminProductListViewer initialData={mockInitialData} categories={mockCategories} />);

    const outOfStockTab = screen.getByRole('button', { name: /품절 \(1\)/i });
    fireEvent.click(outOfStockTab);

    expect(screen.getByText('스마트 피트니스 워치')).toBeInTheDocument();
    expect(screen.queryByText('프리미엄 무선 헤드폰')).not.toBeInTheDocument();
    expect(screen.queryByText('오가닉 코튼 티셔츠')).not.toBeInTheDocument();
  });

  it('카테고리 선택 시 해당 카테고리 상품만 표시된다', () => {
    render(<AdminProductListViewer initialData={mockInitialData} categories={mockCategories} />);

    const select = screen.getByLabelText('카테고리 필터');
    fireEvent.change(select, { target: { value: 'cat-fashion' } });

    expect(screen.getByText('오가닉 코튼 티셔츠')).toBeInTheDocument();
    expect(screen.queryByText('프리미엄 무선 헤드폰')).not.toBeInTheDocument();
    expect(screen.queryByText('스마트 피트니스 워치')).not.toBeInTheDocument();
  });

  it('상품 진열 상태를 셀렉트박스로 변경하면 toggleProductStatusAction이 호출된다', async () => {
    mockToggleStatusAction.mockResolvedValueOnce({
      success: true,
      data: { id: 'prod-1', status: 'OUT_OF_STOCK' },
    });

    render(<AdminProductListViewer initialData={mockInitialData} categories={mockCategories} />);

    const statusSelect = screen.getByLabelText('상품 프리미엄 무선 헤드폰 상태 변경');
    fireEvent.change(statusSelect, { target: { value: 'OUT_OF_STOCK' } });

    await waitFor(() => {
      expect(mockToggleStatusAction).toHaveBeenCalledWith({
        id: 'prod-1',
        status: 'OUT_OF_STOCK',
      });
    });
  });

  it('삭제 버튼 클릭 시 확인 후 deleteProductAction이 호출된다', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockDeleteProductAction.mockResolvedValueOnce({
      success: true,
      data: true,
    });

    render(<AdminProductListViewer initialData={mockInitialData} categories={mockCategories} />);

    const deleteBtn = screen.getByLabelText('상품 오가닉 코튼 티셔츠 삭제');
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(mockDeleteProductAction).toHaveBeenCalledWith('prod-3');
    });
  });

  it('신규 상품 등록 버튼을 누르면 모달이 열린다', () => {
    render(<AdminProductListViewer initialData={mockInitialData} categories={mockCategories} />);

    const createBtn = screen.getByRole('button', { name: /신규 상품 등록/i });
    fireEvent.click(createBtn);

    expect(screen.getByText('신규 상품 등록', { selector: 'h2' })).toBeInTheDocument();
  });

  it('상품 수정 버튼을 누르면 해당 상품 정보가 포함된 수정 모달이 열린다', () => {
    render(<AdminProductListViewer initialData={mockInitialData} categories={mockCategories} />);

    const editBtn = screen.getByLabelText('상품 프리미엄 무선 헤드폰 수정');
    fireEvent.click(editBtn);

    expect(screen.getByText('상품 정보 수정', { selector: 'h2' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('프리미엄 무선 헤드폰')).toBeInTheDocument();
  });
});
