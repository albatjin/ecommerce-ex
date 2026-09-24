import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategoryDropdown } from './CategoryDropdown';
import type { CategoryTreeNode } from '@/core/application/catalog/dtos/CategoryTreeDTO';

describe('CategoryDropdown', () => {
  const mockCategories: CategoryTreeNode[] = [
    {
      id: 'cat-1',
      name: '패션의류',
      slug: 'fashion',
      depth: 1,
      sortOrder: 1,
      parentId: null,
      children: [
        {
          id: 'cat-2',
          name: '여성의류',
          slug: 'women-fashion',
          depth: 2,
          sortOrder: 1,
          parentId: 'cat-1',
          children: [
            {
              id: 'cat-3',
              name: '코트',
              slug: 'coats',
              depth: 3,
              sortOrder: 1,
              parentId: 'cat-2',
              children: [],
            },
          ],
        },
      ],
    },
  ];

  it('"전체 카테고리" 버튼을 렌더링하고 클릭 시 드롭다운 레이어가 열린다', () => {
    render(<CategoryDropdown categories={mockCategories} />);

    const triggerBtn = screen.getByRole('button', { name: /전체 카테고리/i });
    expect(triggerBtn).toBeInTheDocument();

    // 초기 상태에서는 레이어가 닫혀있음
    expect(screen.queryByText('패션의류 전체보기')).not.toBeInTheDocument();

    // 클릭 시 드롭다운 열림
    fireEvent.click(triggerBtn);
    expect(screen.getByText('패션의류 전체보기')).toBeInTheDocument();
    expect(screen.getByText('여성의류')).toBeInTheDocument();
    expect(screen.getByText('코트')).toBeInTheDocument();
  });

  it('카테고리 prop이 없을 때 기본 카테고리로 안전하게 렌더링된다', () => {
    render(<CategoryDropdown />);

    const triggerBtn = screen.getByRole('button', { name: /전체 카테고리/i });
    fireEvent.click(triggerBtn);

    expect(screen.getByText('패션의류/잡화 전체보기')).toBeInTheDocument();
  });
});

