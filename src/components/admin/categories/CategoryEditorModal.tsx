'use client';

import { useState, useEffect, useTransition } from 'react';
import { X, Sparkles, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { AdminCategoryNodeDTO } from '@/core/application/catalog';
import {
  createCategoryAction,
  updateCategoryAction,
} from '@/app/actions/category-admin.actions';

interface CategoryOption {
  id: string;
  name: string;
  depth: number;
}

interface CategoryEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  categoryToEdit?: AdminCategoryNodeDTO | null;
  defaultParentId?: string | null;
  availableParents: CategoryOption[];
}

export function CategoryEditorModal({
  isOpen,
  onClose,
  onSaved,
  categoryToEdit,
  defaultParentId,
  availableParents,
}: CategoryEditorModalProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [sortOrder, setSortOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isEditing = Boolean(categoryToEdit);

  useEffect(() => {
    if (isOpen) {
      if (categoryToEdit) {
        setName(categoryToEdit.name);
        setSlug(categoryToEdit.slug);
        setParentId(categoryToEdit.parentId || '');
        setSortOrder(categoryToEdit.sortOrder);
        setIsActive(categoryToEdit.isActive);
      } else {
        setName('');
        setSlug('');
        setParentId(defaultParentId || '');
        setSortOrder(1);
        setIsActive(true);
      }
      setError(null);
    }
  }, [isOpen, categoryToEdit, defaultParentId]);

  if (!isOpen) return null;

  // Selected parent info for depth calculation
  const selectedParent = availableParents.find((p) => p.id === parentId);
  const calculatedDepth = selectedParent ? selectedParent.depth + 1 : 1;

  const getDepthBadge = (depth: number) => {
    if (depth === 1) return { text: '대분류 (1단계)', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' };
    if (depth === 2) return { text: '중분류 (2단계)', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' };
    return { text: '소분류 (3단계)', color: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' };
  };

  const depthInfo = getDepthBadge(calculatedDepth);

  const handleAutoSlug = () => {
    if (!name) return;
    // 영문/숫자/한글 변환 및 정규화
    const sanitized = name
      .toLowerCase()
      .trim()
      .replace(/[\s/\\_]+/g, '-')
      .replace(/[^a-z0-9가-힣-]/g, '')
      .replace(/-+/g, '-');

    if (sanitized) {
      setSlug(sanitized);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('카테고리 이름을 입력해주세요.');
      return;
    }
    if (!slug.trim()) {
      setError('카테고리 슬러그를 입력해주세요.');
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        if (isEditing && categoryToEdit) {
          const res = await updateCategoryAction({
            id: categoryToEdit.id,
            name: name.trim(),
            slug: slug.trim(),
            parentId: parentId || null,
            sortOrder,
            isActive,
          });

          if (!res.success) {
            setError(res.error || '카테고리 수정에 실패했습니다.');
            return;
          }
        } else {
          const res = await createCategoryAction({
            name: name.trim(),
            slug: slug.trim(),
            parentId: parentId || null,
            sortOrder,
            isActive,
          });

          if (!res.success) {
            setError(res.error || '카테고리 등록에 실패했습니다.');
            return;
          }
        }

        onSaved();
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : '작업 중 오류가 발생했습니다.');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isEditing ? '카테고리 수정' : '새 카테고리 등록'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              쇼핑몰 내비게이션 및 상품 분류 체계를 설정합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Depth Indicator */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-medium">분류 계층 레벨</span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${depthInfo.color}`}>
              {depthInfo.text}
            </span>
          </div>

          {/* Parent Category Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              상위 카테고리
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              disabled={isPending}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
            >
              <option value="">[대분류] 최상위 카테고리로 생성</option>
              {availableParents
                .filter((p) => !categoryToEdit || p.id !== categoryToEdit.id)
                .map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    {parent.depth === 1 ? '대분류: ' : '  ㄴ 중분류: '}
                    {parent.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Category Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              카테고리명 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 아우터, 스니커즈, 가전"
              disabled={isPending}
              required
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          {/* Category Slug */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                슬러그 (URL 식별자) <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleAutoSlug}
                disabled={isPending || !name}
                className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
              >
                <Sparkles className="w-3 h-3" />
                이름에서 자동생성
              </button>
            </div>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().trim())}
              placeholder="예: outer, sneakers, digital"
              disabled={isPending}
              required
              className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              URL 주소(/category/{slug || '...'})에 사용되는 고유 식별자입니다.
            </p>
          </div>

          {/* Sort Order & Active Status */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                노출 정렬 순서
              </label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                min={0}
                max={9999}
                disabled={isPending}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
              />
              <p className="text-[11px] text-slate-400 mt-1">숫자가 낮을수록 앞에 노출됩니다.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                공개 / 노출 여부
              </label>
              <div className="pt-1.5">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    disabled={isPending}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                  />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {isActive ? '쇼핑몰에 공개 (활성)' : '비공개 (숨김)'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition disabled:opacity-50"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isEditing ? '변경사항 저장' : '카테고리 생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
