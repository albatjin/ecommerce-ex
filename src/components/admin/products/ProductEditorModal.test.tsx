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
    const fashionOption = options.find((o) => o.text.includes('[대분류] 패션의류/잡화'));
    expect(fashionOption).toBeDefined();
    expect(fashionOption?.value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

    // 폴백 중분류 확인
    const womenOption = options.find((o) => o.text.includes('[중분류] 여성의류'));
    expect(womenOption).toBeDefined();
    expect(womenOption?.value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

    // 폴백 소분류 확인
    const coatOption = options.find((o) => o.text.includes('[소분류] 코트/자켓'));
    expect(coatOption).toBeDefined();
    expect(coatOption?.value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

    // 디지털 대분류 및 하위 확인
    const digitalOption = options.find((o) => o.text.includes('[대분류] 디지털/가전'));
    expect(digitalOption).toBeDefined();
    expect(digitalOption?.value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it('사용자가 전달한 커스텀 categories 계층 트리를 올바르게 평탄화하여 표시한다', () => {
    const customCategories: CategoryTreeNode[] = [
      {
        id: '11111111-1111-4111-8111-111111111111',
        name: '가구/인테리어',
        slug: 'interior',
        depth: 1,
        sortOrder: 1,
        parentId: null,
        children: [
          {
            id: '22222222-2222-4222-8222-222222222222',
            name: '거실가구',
            slug: 'living-room',
            depth: 2,
            sortOrder: 1,
            parentId: '11111111-1111-4111-8111-111111111111',
            children: [
              {
                id: '33333333-3333-4333-8333-333333333333',
                name: '패브릭 소파',
                slug: 'sofa',
                depth: 3,
                sortOrder: 1,
                parentId: '22222222-2222-4222-8222-222222222222',
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

    expect(options.some((o) => o.value === '11111111-1111-4111-8111-111111111111' && o.text.includes('[대분류] 가구/인테리어'))).toBe(true);
    expect(options.some((o) => o.value === '22222222-2222-4222-8222-222222222222' && o.text.includes('[중분류] 거실가구'))).toBe(true);
    expect(options.some((o) => o.value === '33333333-3333-4333-8333-333333333333' && o.text.includes('[소분류] 패브릭 소파'))).toBe(true);
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

    const coatOption = Array.from(select.options).find((o) => o.text.includes('코트/자켓'));
    expect(coatOption).toBeDefined();

    fireEvent.change(select, { target: { value: coatOption!.value } });
    expect(select.value).toBe(coatOption!.value);
  });

  it('기존 상품 수정 시 상품에 저장된 categoryId(slug 또는 UUID)가 기본 선택된다', () => {
    const existingProduct = {
      id: 'prod-edit-1',
      productCode: 'PROD-001',
      nameKo: '테스트 상품',
      nameEn: 'Test Product',
      categoryId: 'women-coats', // slug 형태
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
    expect(select.value).toBe('a0000000-0000-4000-8000-000000000003');
  });

  it('카테고리 "가방/지갑(bags)" 선택 후 저장 시 올바른 UUID 형식으로 변환하여 createProductAction을 호출한다', async () => {
    mockCreateProductAction.mockResolvedValueOnce({
      success: true,
      data: { id: 'new-prod-id', nameKo: '새 가방' },
    });

    render(
      <ProductEditorModal
        isOpen={true}
        onClose={onClose}
        onSaved={onSaved}
        categories={[]}
      />
    );

    fireEvent.change(screen.getByLabelText(/상품명 \(한글\)/i), { target: { value: '새 가방' } });
    fireEvent.change(screen.getByLabelText(/정가 \(원\)/i), { target: { value: '10000' } });
    fireEvent.change(screen.getByLabelText(/판매가 \(원\)/i), { target: { value: '9000' } });

    const select = screen.getByLabelText(/카테고리 분류/i) as HTMLSelectElement;
    const bagsOption = Array.from(select.options).find((o) => o.text.includes('가방/지갑'));
    expect(bagsOption).toBeDefined();

    fireEvent.change(select, { target: { value: bagsOption!.value } });

    const submitBtn = screen.getByRole('button', { name: /상품 등록 완료/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreateProductAction).toHaveBeenCalledWith(
        expect.objectContaining({
          nameKo: '새 가방',
          categoryId: 'a0000000-0000-4000-8000-000000000011', // UUID for bags
        })
      );
    });
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
