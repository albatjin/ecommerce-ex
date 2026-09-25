'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Menu, ChevronRight, ChevronDown, Sparkles } from 'lucide-react';
import type { CategoryTreeNode } from '@/core/application/catalog/dtos/CategoryTreeDTO';
import { DEFAULT_CATEGORIES } from '@/shared/data/defaultCategories';

interface CategoryDropdownProps {
  categories?: CategoryTreeNode[];
}

export function CategoryDropdown({ categories }: CategoryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryTreeNode | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const tree = categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  // 첫 번째 대분류를 기본 활성화
  useEffect(() => {
    if (tree.length > 0 && !activeCategory) {
      setActiveCategory(tree[0]);
    }
  }, [tree, activeCategory]);

  // 바깥 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* 트리거 버튼 */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-sm text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Menu className="w-4 h-4 text-blue-600" />
        <span>전체 카테고리</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* 드롭다운 레이어 */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-[640px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden flex min-h-[320px] animate-in fade-in-50 zoom-in-95 duration-150">
          {/* 좌측: 1차 대분류 목록 */}
          <div className="w-48 bg-slate-50 dark:bg-slate-900/60 border-r border-slate-200 dark:border-slate-800 py-2">
            {tree.map((cat) => {
              const isSelected = activeCategory?.id === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onMouseEnter={() => setActiveCategory(cat)}
                  onClick={() => setActiveCategory(cat)}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-white dark:bg-slate-800 text-blue-600 font-bold border-l-3 border-blue-600'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                  <ChevronRight
                    className={`w-3.5 h-3.5 ${
                      isSelected ? 'text-blue-600' : 'text-slate-400 opacity-60'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* 우측: 2차 중분류 및 3차 소분류 그리드 */}
          <div className="flex-1 p-5 overflow-y-auto max-h-[420px]">
            {activeCategory ? (
              <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                  <Link
                    href={`/products?category=${activeCategory.slug}`}
                    onClick={() => setIsOpen(false)}
                    className="font-bold text-base text-slate-900 dark:text-white hover:text-blue-600 flex items-center gap-1.5"
                  >
                    <span>{activeCategory.name} 전체보기</span>
                    <ChevronRight className="w-4 h-4 text-blue-600" />
                  </Link>
                  <span className="text-xs text-slate-400">대분류 바로가기</span>
                </div>

                {activeCategory.children && activeCategory.children.length > 0 ? (
                  <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                    {activeCategory.children.map((subCat) => (
                      <div key={subCat.id} className="space-y-1.5">
                        <Link
                          href={`/products?category=${subCat.slug}`}
                          onClick={() => setIsOpen(false)}
                          className="font-semibold text-xs tracking-wider uppercase text-slate-800 dark:text-slate-200 hover:text-blue-600 flex items-center gap-1"
                        >
                          <span>{subCat.name}</span>
                        </Link>
                        {subCat.children && subCat.children.length > 0 && (
                          <ul className="space-y-1 pl-1">
                            {subCat.children.map((thirdCat) => (
                              <li key={thirdCat.id}>
                                <Link
                                  href={`/products?category=${thirdCat.slug}`}
                                  onClick={() => setIsOpen(false)}
                                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 hover:underline transition-colors block py-0.5"
                                >
                                  {thirdCat.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-slate-400">
                    <p>등록된 세부 하위 카테고리가 없습니다.</p>
                    <Link
                      href={`/products?category=${activeCategory.slug}`}
                      onClick={() => setIsOpen(false)}
                      className="inline-block mt-3 text-xs text-blue-600 font-semibold hover:underline"
                    >
                      {activeCategory.name} 상품 보러가기 →
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                카테고리를 선택하세요
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

