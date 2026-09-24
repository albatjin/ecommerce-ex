import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterSidebar } from './FilterSidebar';
import type { CategoryTreeNode } from '@/core/application/catalog/dtos/CategoryTreeDTO';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => '/products',
  useSearchParams: () => new URLSearchParams(),
}));

describe('FilterSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const sampleCategories: CategoryTreeNode[] = [
    {
      id: 'cat-1',
      name: '패션의류',
      slug: 'fashion',
      depth: 1,
      sortOrder: 1,
      parentId: null,
      children: [],
    },
    {
      id: 'cat-2',
      name: '디지털/가전',
      slug: 'digital',
      depth: 1,
      sortOrder: 2,
      parentId: null,
      children: [],
    },
  ];

  it('카테고리 목록과 가격대 프리셋 버튼을 렌더링한다', () => {
    render(<FilterSidebar categories={sampleCategories} />);

    expect(screen.getByText('상세 필터')).toBeInTheDocument();
    expect(screen.getByText('패션의류')).toBeInTheDocument();
    expect(screen.getByText('디지털/가전')).toBeInTheDocument();
    expect(screen.getByText('3만원 이하')).toBeInTheDocument();
    expect(screen.getByText('할인 상품만 보기')).toBeInTheDocument();
  });

  it('카테고리 클릭 시 router.push로 URL 파라미터를 갱신한다', () => {
    render(<FilterSidebar categories={sampleCategories} />);

    const fashionBtn = screen.getByRole('button', { name: /패션의류/i });
    fireEvent.click(fashionBtn);

    expect(pushMock).toHaveBeenCalledWith('/products?category=fashion');
  });

  it('할인 상품만 보기 체크박스 변경 시 router.push를 호출한다', () => {
    render(<FilterSidebar categories={sampleCategories} />);

    const checkbox = screen.getByRole('checkbox', { name: /할인 상품만 보기/i });
    fireEvent.click(checkbox);

    expect(pushMock).toHaveBeenCalledWith('/products?hasDiscount=true');
  });
});

