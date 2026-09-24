'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ArrowDownUp } from 'lucide-react';

interface SortSelectProps {
  currentSort?: string;
}

export function SortSelect({ currentSort = 'created_at' }: SortSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page'); // 정렬 변경 시 1페이지로 리셋

    const newSort = e.target.value;
    if (newSort === 'created_at') {
      params.delete('sort');
    } else {
      params.set('sort', newSort);
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <ArrowDownUp className="w-3.5 h-3.5 text-slate-400" />
      <select
        value={currentSort}
        onChange={handleSortChange}
        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
        aria-label="상품 정렬 순서 선택"
      >
        <option value="created_at">최신순</option>
        <option value="popular">인기순</option>
        <option value="price_asc">낮은 가격순</option>
        <option value="price_desc">높은 가격순</option>
      </select>
    </div>
  );
}

