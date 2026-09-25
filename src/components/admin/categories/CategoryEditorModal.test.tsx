import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CategoryEditorModal } from './CategoryEditorModal';
import type { AdminCategoryNodeDTO } from '@/core/application/catalog';

const mockCreateCategory = vi.fn();
const mockUpdateCategory = vi.fn();

vi.mock('@/app/actions/category-admin.actions', () => ({
  createCategoryAction: (...args: unknown[]) => mockCreateCategory(...args),
  updateCategoryAction: (...args: unknown[]) => mockUpdateCategory(...args),
}));

const mockAvailableParents = [
  { id: 'cat-1', name: '패션의류', depth: 1 },
  { id: 'cat-2', name: '여성의류', depth: 2 },
];

describe('CategoryEditorModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('isOpen이 false이면 렌더링되지 않는다', () => {
    const { container } = render(
      <CategoryEditorModal
        isOpen={false}
        onClose={vi.fn()}
        onSaved={vi.fn()}
        availableParents={mockAvailableParents}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('새 카테고리 등록 시 빈 폼과 기본값을 렌더링한다', () => {
    render(
      <CategoryEditorModal
        isOpen={true}
        onClose={vi.fn()}
        onSaved={vi.fn()}
        availableParents={mockAvailableParents}
      />
    );

    expect(screen.getByText('새 카테고리 등록')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('예: 아우터, 스니커즈, 가전')).toHaveValue('');
    expect(screen.getByText('대분류 (1단계)')).toBeInTheDocument();
  });

  it('기존 카테고리 수정 시 기존 데이터가 채워진다', () => {
    const categoryToEdit: AdminCategoryNodeDTO = {
      id: 'cat-2',
      name: '여성의류',
      slug: 'women-fashion',
      parentId: 'cat-1',
      depth: 2,
      sortOrder: 3,
      isActive: true,
      createdAt: '2026-09-01T00:00:00Z',
      children: [],
    };

    render(
      <CategoryEditorModal
        isOpen={true}
        onClose={vi.fn()}
        onSaved={vi.fn()}
        categoryToEdit={categoryToEdit}
        availableParents={mockAvailableParents}
      />
    );

    expect(screen.getByText('카테고리 수정')).toBeInTheDocument();
    expect(screen.getByDisplayValue('여성의류')).toBeInTheDocument();
    expect(screen.getByDisplayValue('women-fashion')).toBeInTheDocument();
    expect(screen.getByDisplayValue(3)).toBeInTheDocument();
    expect(screen.getByText('중분류 (2단계)')).toBeInTheDocument();
  });

  it('자동 슬러그 생성 버튼을 누르면 카테고리명 기반으로 슬러그가 채워진다', () => {
    render(
      <CategoryEditorModal
        isOpen={true}
        onClose={vi.fn()}
        onSaved={vi.fn()}
        availableParents={mockAvailableParents}
      />
    );

    const nameInput = screen.getByPlaceholderText('예: 아우터, 스니커즈, 가전');
    fireEvent.change(nameInput, { target: { value: 'Men Pants' } });

    const autoSlugBtn = screen.getByRole('button', { name: /이름에서 자동생성/i });
    fireEvent.click(autoSlugBtn);

    const slugInput = screen.getByPlaceholderText('예: outer, sneakers, digital');
    expect(slugInput).toHaveValue('men-pants');
  });

  it('새 카테고리 등록 폼 제출 시 createCategoryAction을 호출하고 onSaved가 호출된다', async () => {
    mockCreateCategory.mockResolvedValueOnce({
      success: true,
      data: { id: 'new-cat', name: '스포츠' },
    });

    const mockOnSaved = vi.fn();
    const mockOnClose = vi.fn();

    render(
      <CategoryEditorModal
        isOpen={true}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
        availableParents={mockAvailableParents}
      />
    );

    const nameInput = screen.getByPlaceholderText('예: 아우터, 스니커즈, 가전');
    const slugInput = screen.getByPlaceholderText('예: outer, sneakers, digital');
    fireEvent.change(nameInput, { target: { value: '스포츠' } });
    fireEvent.change(slugInput, { target: { value: 'sports' } });

    const submitBtn = screen.getByRole('button', { name: '카테고리 생성' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreateCategory).toHaveBeenCalledWith(
        expect.objectContaining({
          name: '스포츠',
          slug: 'sports',
          parentId: null,
        })
      );
      expect(mockOnSaved).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('수정 폼 제출 시 updateCategoryAction을 호출한다', async () => {
    mockUpdateCategory.mockResolvedValueOnce({
      success: true,
      data: { id: 'cat-1', name: '패션/의류' },
    });

    const mockOnSaved = vi.fn();
    const mockOnClose = vi.fn();

    const categoryToEdit: AdminCategoryNodeDTO = {
      id: 'cat-1',
      name: '패션의류',
      slug: 'fashion',
      parentId: null,
      depth: 1,
      sortOrder: 1,
      isActive: true,
      createdAt: '2026-09-01T00:00:00Z',
      children: [],
    };

    render(
      <CategoryEditorModal
        isOpen={true}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
        categoryToEdit={categoryToEdit}
        availableParents={mockAvailableParents}
      />
    );

    const nameInput = screen.getByDisplayValue('패션의류');
    fireEvent.change(nameInput, { target: { value: '패션/의류' } });

    const submitBtn = screen.getByRole('button', { name: '변경사항 저장' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockUpdateCategory).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'cat-1',
          name: '패션/의류',
        })
      );
      expect(mockOnSaved).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
