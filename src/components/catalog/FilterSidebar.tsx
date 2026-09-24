'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { RotateCcw, Filter, Check } from 'lucide-react';
import type { CategoryTreeNode } from '@/core/application/catalog/dtos/CategoryTreeDTO';

interface FilterSidebarProps {
  categories?: CategoryTreeNode[];
  className?: string;
}

const PRICE_PRESETS = [
  { label: '전체 가격', min: null, max: null },
  { label: '3만원 이하', min: null, max: 30000 },
  { label: '3만원 ~ 5만원', min: 30000, max: 50000 },
  { label: '5만원 ~ 10만원', min: 50000, max: 100000 },
  { label: '10만원 이상', min: 100000, max: null },
];

export function FilterSidebar({ categories = [], className = '' }: FilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get('category') || '';
  const currentMinPrice = searchParams.get('minPrice') || '';
  const currentMaxPrice = searchParams.get('maxPrice') || '';
  const currentDiscount = searchParams.get('hasDiscount') === 'true';

  const [customMin, setCustomMin] = useState(currentMinPrice);
  const [customMax, setCustomMax] = useState(currentMaxPrice);

  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page'); // 필터 변경 시 1페이지로 리셋

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePricePreset = (min: number | null, max: number | null) => {
    setCustomMin(min !== null ? String(min) : '');
    setCustomMax(max !== null ? String(max) : '');
    updateFilters({
      minPrice: min !== null ? String(min) : null,
      maxPrice: max !== null ? String(max) : null,
    });
  };

  const handleCustomPriceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({
      minPrice: customMin.trim() ? customMin.trim() : null,
      maxPrice: customMax.trim() ? customMax.trim() : null,
    });
  };

  const resetFilters = () => {
    setCustomMin('');
    setCustomMax('');
    router.push(pathname);
  };

  const hasActiveFilters =
    Boolean(currentCategory) ||
    Boolean(currentMinPrice) ||
    Boolean(currentMaxPrice) ||
    currentDiscount;

  return (
    <aside className={`w-full space-y-6 ${className}`}>
      {/* 헤더 & 초기화 버튼 */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-600" />
          <h2 className="font-bold text-base text-slate-900 dark:text-white">상세 필터</h2>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>초기화</span>
          </button>
        )}
      </div>

      {/* 1. 카테고리 필터 */}
      {categories.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">카테고리</h3>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => updateFilters({ category: null })}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer flex items-center justify-between ${
                !currentCategory
                  ? 'bg-blue-50 text-blue-600 font-bold dark:bg-blue-950/50'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>전체 카테고리</span>
              {!currentCategory && <Check className="w-4 h-4 text-blue-600" />}
            </button>
            {categories.map((cat) => {
              const isSelected = currentCategory === cat.slug;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => updateFilters({ category: isSelected ? null : cat.slug })}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-50 text-blue-600 font-bold dark:bg-blue-950/50'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{cat.name}</span>
                  {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. 할인 상품만 보기 토글 */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={currentDiscount}
            onChange={(e) => updateFilters({ hasDiscount: e.target.checked ? 'true' : null })}
            className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
          />
          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
            할인 상품만 보기
          </span>
        </label>
      </div>

      {/* 3. 가격대 필터 */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">가격대</h3>

        {/* 프리셋 버튼 */}
        <div className="space-y-1">
          {PRICE_PRESETS.map((preset, idx) => {
            const isSelected =
              preset.min === (currentMinPrice ? Number(currentMinPrice) : null) &&
              preset.max === (currentMaxPrice ? Number(currentMaxPrice) : null);

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handlePricePreset(preset.min, preset.max)}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-slate-900 text-white font-semibold dark:bg-slate-100 dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{preset.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>

        {/* 직접 입력 폼 */}
        <form onSubmit={handleCustomPriceSubmit} className="pt-2 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="최소원"
              value={customMin}
              onChange={(e) => setCustomMin(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:border-blue-500 focus:outline-none"
            />
            <span className="text-slate-400 text-xs">~</span>
            <input
              type="number"
              placeholder="최대원"
              value={customMax}
              onChange={(e) => setCustomMax(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            가격 적용
          </button>
        </form>
      </div>
    </aside>
  );
}
