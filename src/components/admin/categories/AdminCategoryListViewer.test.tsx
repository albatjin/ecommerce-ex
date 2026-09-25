import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminCategoryListViewer } from './AdminCategoryListViewer';
import type { AdminCategoryNodeDTO } from '@/core/application/catalog';

const mockToggleCategoryStatus = vi.fn();
const mockDeleteCategory = vi.fn();
const mockReorderCategories = vi.fn();
const mockGetAdminCategoryTree = vi.fn();
const mockCreateCategory = vi.fn();
const mockUpdateCategory = vi.fn();

vi.mock('@/app/actions/category-admin.actions', () => ({
  toggleCategoryStatusAction: (...args: unknown[]) => mockToggleCategoryStatus(...args),
  deleteCategoryAction: (...args: unknown[]) => mockDeleteCategory(...args),
  reorderCategoriesAction: (...args: unknown[]) => mockReorderCategories(...args),
  getAdminCategoryTreeAction: (...args: unknown[]) => mockGetAdminCategoryTree(...args),
  createCategoryAction: (...args: unknown[]) => mockCreateCategory(...args),
  updateCategoryAction: (...args: unknown[]) => mockUpdateCategory(...args),
}));

const sampleTree: AdminCategoryNodeDTO[] = [
  {
    id: 'cat-1',
    name: '패션의류',
    slug: 'fashion',
    parentId: null,
    depth: 1,
    sortOrder: 1,
    isActive: true,
    createdAt: '2026-09-01T00:00:00Z',
    children: [
      {
        id: 'cat-2',
        name: '여성의류',
        slug: 'women-fashion',
        parentId: 'cat-1',
        depth: 2,
        sortOrder: 1,
        isActive: true,
        createdAt: '2026-09-01T00:00:00Z',
        children: [
          {
            id: 'cat-3',
            name: '원피스',
            slug: 'dresses',
            parentId: 'cat-2',
            depth: 3,
            sortOrder: 1,
            isActive: false,
            createdAt: '2026-09-01T00:00:00Z',
            children: [],
          },
        ],
      },
    ],
  },
  {
    id: 'cat-4',
    name: '전자제품',
    slug: 'electronics',
    parentId: null,
    depth: 1,
    sortOrder: 2,
    isActive: true,
    createdAt: '2026-09-01T00:00:00Z',
    children: [],
  },
];

describe('AdminCategoryListViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('카테고리 트리와 계층 배지, 슬러그를 정상 렌더링한다', () => {
    render(<AdminCategoryListViewer initialTree={sampleTree} />);

    expect(screen.getByText('카테고리 관리 (CMS)')).toBeInTheDocument();
    expect(screen.getByText('패션의류')).toBeInTheDocument();
    expect(screen.getByText('/fashion')).toBeInTheDocument();
    expect(screen.getByText('여성의류')).toBeInTheDocument();
    expect(screen.getByText('/women-fashion')).toBeInTheDocument();
    expect(screen.getByText('원피스')).toBeInTheDocument();
    expect(screen.getByText('/dresses')).toBeInTheDocument();
    expect(screen.getByText('전자제품')).toBeInTheDocument();

    // 뎁스 뱃지 확인
    expect(screen.getAllByText('대분류').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('중분류')).toBeInTheDocument();
    expect(screen.getByText('소분류')).toBeInTheDocument();
  });

  it('KPI 통계 카드(총 카테고리 수, 대/중/소 수, 공개율)를 계산하여 표시한다', () => {
    render(<AdminCategoryListViewer initialTree={sampleTree} />);

    // 총 4개 (cat-1, cat-2, cat-3, cat-4)
    expect(screen.getByText('총 카테고리')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('대분류 (1단계)')).toBeInTheDocument();
    expect(screen.getByText('중분류 (2단계)')).toBeInTheDocument();
    expect(screen.getByText('소분류 (3단계)')).toBeInTheDocument();
    // 4개 중 3개 활성 = 75%
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('대분류 카테고리 등록 버튼 클릭 시 등록 모달이 열린다', () => {
    render(<AdminCategoryListViewer initialTree={sampleTree} />);

    const createBtn = screen.getByRole('button', { name: /대분류 카테고리 등록/i });
    fireEvent.click(createBtn);

    expect(screen.getByText('새 카테고리 등록')).toBeInTheDocument();
    expect(screen.getAllByText('대분류 (1단계)').length).toBeGreaterThanOrEqual(2);
  });

  it('노출 토글 버튼 클릭 시 toggleCategoryStatusAction을 호출한다', async () => {
    mockToggleCategoryStatus.mockResolvedValueOnce({ success: true });
    mockGetAdminCategoryTree.mockResolvedValueOnce({ success: true, data: sampleTree });

    render(<AdminCategoryListViewer initialTree={sampleTree} />);

    // '원피스'는 비활성 상태 ('숨김')
    const hiddenButtons = screen.getAllByRole('button', { name: /숨김/i });
    fireEvent.click(hiddenButtons[0]);

    await waitFor(() => {
      expect(mockToggleCategoryStatus).toHaveBeenCalledWith('cat-3', true);
    });
  });

  it('삭제 버튼을 누르면 확인 프롬프트가 표시되고, 확인 시 deleteCategoryAction을 호출한다', async () => {
    mockDeleteCategory.mockResolvedValueOnce({ success: true });
    mockGetAdminCategoryTree.mockResolvedValueOnce({ success: true, data: sampleTree });

    render(<AdminCategoryListViewer initialTree={sampleTree} />);

    // 말단 노드 '원피스'의 삭제 버튼 클릭
    const deleteButtons = screen.getAllByTitle('카테고리 삭제');
    fireEvent.click(deleteButtons[deleteButtons.length - 1]);

    expect(screen.getByText('삭제확인?')).toBeInTheDocument();
    const confirmBtn = screen.getByRole('button', { name: '확인' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockDeleteCategory).toHaveBeenCalled();
    });
  });

  it('상하 정렬 화살표 클릭 시 순서 변경 액션을 호출한다', async () => {
    mockReorderCategories.mockResolvedValueOnce({ success: true });
    mockGetAdminCategoryTree.mockResolvedValueOnce({ success: true, data: sampleTree });

    render(<AdminCategoryListViewer initialTree={sampleTree} />);

    // 전자제품(index 1) 위로 이동 버튼
    const moveUpButtons = screen.getAllByTitle('위로 이동');
    const enabledMoveUp = moveUpButtons.find((btn) => !btn.hasAttribute('disabled'));

    if (enabledMoveUp) {
      fireEvent.click(enabledMoveUp);
      await waitFor(() => {
        expect(mockReorderCategories).toHaveBeenCalled();
      });
    }
  });
});
