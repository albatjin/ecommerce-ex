import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductEditorModal } from './ProductEditorModal';
import type { CategoryTreeNode } from '@/core/application/catalog/dtos/CategoryTreeDTO';

const mockCreateProductAction = vi.fn();
const mockUpdateProductAction = vi.fn();
const mockUploadProductImageAction = vi.fn();

vi.mock('@/app/actions/product-admin.actions', () => ({
  createProductAction: (...args: unknown[]) => mockCreateProductAction(...args),
  updateProductAction: (...args: unknown[]) => mockUpdateProductAction(...args),
  uploadProductImageAction: (...args: unknown[]) => mockUploadProductImageAction(...args),
}));

describe('ProductEditorModal Component', () => {
  const onClose = vi.fn();
  const onSaved = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('categories prop이 비어있거나 주어지지 않았을 때 DEFAULT_CATEGORIES를 폴백으로 드롭다운에 대/중/소 계층을 렌더링한다', () => {
    render(
      <ProductEditorModal
        isOpen={true}
        onClose={onClose}
        onSaved={onSaved}
        categories={[]}
      />
    );

    const select = screen.getByLabelText(/카테고리 분류/i) as HTMLSelectElement;
    expect(select).toBeInTheDocument();

    const options = Array.from(select.options);
    // 기본 선택 옵션 확인
    expect(options[0].text).toBe('카테고리 선택 (없음)');
    expect(options[0].value).toBe('');

    // 폴백 대분류 확인
    const fashionOption = options.find((o) => o.value === 'fashion');
    expect(fashionOption).toBeDefined();
    expect(fashionOption?.text).toContain('[대분류] 패션의류/잡화');

    // 폴백 중분류 확인
    const womenOption = options.find((o) => o.value === 'women-fashion');
    expect(womenOption).toBeDefined();
    expect(womenOption?.text).toContain('[중분류] 여성의류');

    // 폴백 소분류 확인
    const coatOption = options.find((o) => o.value === 'women-coats');
    expect(coatOption).toBeDefined();
    expect(coatOption?.text).toContain('[소분류] 코트/자켓');

    // 디지털 대분류 및 하위 확인
    const digitalOption = options.find((o) => o.value === 'digital');
    expect(digitalOption).toBeDefined();
    expect(digitalOption?.text).toContain('[대분류] 디지털/가전');
  });

  it('사용자가 전달한 커스텀 categories 계층 트리를 올바르게 평탄화하여 표시한다', () => {
    const customCategories: CategoryTreeNode[] = [
      {
        id: 'cat-custom-1',
        name: '가구/인테리어',
        slug: 'interior',
        depth: 1,
        sortOrder: 1,
        parentId: null,
        children: [
          {
            id: 'cat-custom-1-1',
            name: '거실가구',
            slug: 'living-room',
            depth: 2,
            sortOrder: 1,
            parentId: 'cat-custom-1',
            children: [
              {
                id: 'cat-custom-1-1-1',
                name: '패브릭 소파',
                slug: 'sofa',
                depth: 3,
                sortOrder: 1,
                parentId: 'cat-custom-1-1',
                children: [],
              },
            ],
          },
        ],
      },
    ];

    render(
      <ProductEditorModal
        isOpen={true}
        onClose={onClose}
        onSaved={onSaved}
        categories={customCategories}
      />
    );

    const select = screen.getByLabelText(/카테고리 분류/i) as HTMLSelectElement;
    const options = Array.from(select.options);

    expect(options.some((o) => o.value === 'cat-custom-1' && o.text.includes('[대분류] 가구/인테리어'))).toBe(true);
    expect(options.some((o) => o.value === 'cat-custom-1-1' && o.text.includes('[중분류] 거실가구'))).toBe(true);
    expect(options.some((o) => o.value === 'cat-custom-1-1-1' && o.text.includes('[소분류] 패브릭 소파'))).toBe(true);
  });

  it('카테고리 선택을 변경하면 select의 값이 올바르게 반영된다', () => {
    render(
      <ProductEditorModal
        isOpen={true}
        onClose={onClose}
        onSaved={onSaved}
        categories={[]}
      />
    );

    const select = screen.getByLabelText(/카테고리 분류/i) as HTMLSelectElement;
    expect(select.value).toBe('');

    fireEvent.change(select, { target: { value: 'women-coats' } });
    expect(select.value).toBe('women-coats');
  });

  it('기존 상품 수정 시 상품에 저장된 categoryId가 기본 선택된다', () => {
    const existingProduct = {
      id: 'prod-edit-1',
      productCode: 'PROD-001',
      nameKo: '테스트 상품',
      nameEn: 'Test Product',
      categoryId: 'women-coats',
      regularPrice: 50000,
      salePrice: 45000,
      discountRate: 10,
      taxType: 'TAXABLE' as const,
      stockQuantity: 20,
      isOrderable: true,
      status: 'ACTIVE' as const,
      brandName: 'TestBrand',
      coverImageUrl: null,
      shippingFee: 3000,
      createdAt: '2026-09-01T00:00:00Z',
    };

    render(
      <ProductEditorModal
        isOpen={true}
        onClose={onClose}
        onSaved={onSaved}
        product={existingProduct}
        categories={[]}
      />
    );

    const select = screen.getByLabelText(/카테고리 분류/i) as HTMLSelectElement;
    expect(select.value).toBe('women-coats');
  });

  it('모달 닫기 버튼 클릭 시 onClose가 호출된다', () => {
    render(
      <ProductEditorModal
        isOpen={true}
        onClose={onClose}
        onSaved={onSaved}
        categories={[]}
      />
    );

    const closeBtn = screen.getByRole('button', { name: /취소/i });
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalled();
  });
});
