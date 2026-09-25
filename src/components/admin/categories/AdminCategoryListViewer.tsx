'use client';

import { useState, useTransition, useMemo } from 'react';
import {
  FolderTree,
  Plus,
  ChevronDown,
  ChevronRight,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  XCircle,
  Search,
  Eye,
  EyeOff,
  Layers,
  FolderPlus,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import type { AdminCategoryNodeDTO } from '@/core/application/catalog';
import {
  toggleCategoryStatusAction,
  deleteCategoryAction,
  reorderCategoriesAction,
  getAdminCategoryTreeAction,
} from '@/app/actions/category-admin.actions';
import { CategoryEditorModal } from './CategoryEditorModal';

interface AdminCategoryListViewerProps {
  initialTree: AdminCategoryNodeDTO[];
}

export function AdminCategoryListViewer({ initialTree }: AdminCategoryListViewerProps) {
  const [tree, setTree] = useState<AdminCategoryNodeDTO[]>(initialTree);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const allIds = new Set<string>();
    const collect = (nodes: AdminCategoryNodeDTO[]) => {
      for (const n of nodes) {
        allIds.add(n.id);
        if (n.children && n.children.length > 0) collect(n.children);
      }
    };
    collect(initialTree);
    return allIds;
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<AdminCategoryNodeDTO | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  // Refresh tree from server
  const refreshTree = async () => {
    const res = await getAdminCategoryTreeAction();
    if (res.success && res.data) {
      setTree(res.data);
    }
  };

  // Flattened categories for parent selection (depth 1 and 2 only)
  const availableParents = useMemo(() => {
    const list: { id: string; name: string; depth: number }[] = [];
    const traverse = (nodes: AdminCategoryNodeDTO[]) => {
      for (const n of nodes) {
        if (n.depth < 3) {
          list.push({ id: n.id, name: n.name, depth: n.depth });
        }
        if (n.children && n.children.length > 0) {
          traverse(n.children);
        }
      }
    };
    traverse(tree);
    return list;
  }, [tree]);

  // Tree Statistics
  const stats = useMemo(() => {
    let total = 0;
    let depth1 = 0;
    let depth2 = 0;
    let depth3 = 0;
    let active = 0;

    const countNodes = (nodes: AdminCategoryNodeDTO[]) => {
      for (const node of nodes) {
        total++;
        if (node.depth === 1) depth1++;
        else if (node.depth === 2) depth2++;
        else if (node.depth === 3) depth3++;

        if (node.isActive) active++;
        if (node.children && node.children.length > 0) {
          countNodes(node.children);
        }
      }
    };

    countNodes(tree);
    const activeRate = total > 0 ? Math.round((active / total) * 100) : 0;

    return { total, depth1, depth2, depth3, active, activeRate };
  }, [tree]);

  // Toggle Collapse/Expand
  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    const all = new Set<string>();
    const collect = (nodes: AdminCategoryNodeDTO[]) => {
      for (const n of nodes) {
        all.add(n.id);
        if (n.children) collect(n.children);
      }
    };
    collect(tree);
    setExpandedIds(all);
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  // Open Create Modal
  const handleOpenCreateModal = (parentId: string | null = null) => {
    setCategoryToEdit(null);
    setDefaultParentId(parentId);
    setIsModalOpen(true);
    setActionError(null);
  };

  // Open Edit Modal
  const handleOpenEditModal = (node: AdminCategoryNodeDTO) => {
    setCategoryToEdit(node);
    setDefaultParentId(node.parentId);
    setIsModalOpen(true);
    setActionError(null);
  };

  // Toggle Active/Inactive Status
  const handleToggleStatus = (node: AdminCategoryNodeDTO) => {
    startTransition(async () => {
      try {
        const nextStatus = !node.isActive;
        const res = await toggleCategoryStatusAction(node.id, nextStatus);
        if (!res.success) {
          setActionError(res.error || '상태 변경에 실패했습니다.');
          return;
        }
        setActionSuccess(`'${node.name}' 카테고리 상태가 변경되었습니다.`);
        await refreshTree();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      }
    });
  };

  // Delete Category
  const handleDeleteCategory = (id: string) => {
    startTransition(async () => {
      try {
        const res = await deleteCategoryAction(id);
        if (!res.success) {
          setActionError(res.error || '삭제에 실패했습니다.');
          setDeleteConfirmId(null);
          return;
        }
        setActionSuccess('카테고리가 성공적으로 삭제되었습니다.');
        setDeleteConfirmId(null);
        await refreshTree();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : '오류가 발생했습니다.');
        setDeleteConfirmId(null);
      }
    });
  };

  // Move Sibling Category (Up / Down)
  const handleMoveOrder = (
    siblings: AdminCategoryNodeDTO[],
    currentIndex: number,
    direction: 'up' | 'down'
  ) => {
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= siblings.length) return;

    const currentItem = siblings[currentIndex];
    const targetItem = siblings[targetIndex];

    startTransition(async () => {
      try {
        // Swap sort orders
        const res = await reorderCategoriesAction([
          { id: currentItem.id, sortOrder: targetItem.sortOrder },
          { id: targetItem.id, sortOrder: currentItem.sortOrder },
        ]);

        if (!res.success) {
          setActionError(res.error || '순서 변경에 실패했습니다.');
          return;
        }
        await refreshTree();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : '순서 변경 실패');
      }
    });
  };

  // Recursive Render Tree Node
  const renderCategoryNode = (
    node: AdminCategoryNodeDTO,
    siblings: AdminCategoryNodeDTO[],
    index: number
  ) => {
    const isExpanded = expandedIds.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isMatchingSearch =
      !searchQuery ||
      node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.slug.toLowerCase().includes(searchQuery.toLowerCase());

    const depthBadge =
      node.depth === 1
        ? { text: '대분류', style: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900' }
        : node.depth === 2
        ? { text: '중분류', style: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900' }
        : { text: '소분류', style: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-900' };

    const indentPadding =
      node.depth === 1 ? 'pl-4' : node.depth === 2 ? 'pl-10' : 'pl-16';

    return (
      <div key={node.id} className="flex flex-col border-b border-slate-100 dark:border-slate-800/80">
        <div
          className={`flex items-center justify-between py-3.5 pr-4 ${indentPadding} hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
            !node.isActive ? 'opacity-60 bg-slate-50/30 dark:bg-slate-900/30' : ''
          }`}
        >
          {/* Left: Tree Expander, Badges, Name, Slug */}
          <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
            {/* Expand / Collapse Icon */}
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleExpand(node.id)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition"
                title={isExpanded ? '접기' : '펼치기'}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                )}
              </button>
            ) : (
              <span className="w-6 shrink-0" />
            )}

            {/* Depth Badge */}
            <span
              className={`px-2 py-0.5 text-[11px] font-bold border rounded-md shrink-0 ${depthBadge.style}`}
            >
              {depthBadge.text}
            </span>

            {/* Category Name */}
            <div className="flex items-center gap-2 truncate">
              <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {node.name}
              </span>
              <span className="text-xs font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md truncate">
                /{node.slug}
              </span>
              {hasChildren && (
                <span className="text-[11px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded-full">
                  하위 {node.children.length}
                </span>
              )}
            </div>
          </div>

          {/* Right: Sort Controls, Active Toggle, Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Move Up / Down Buttons */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => handleMoveOrder(siblings, index, 'up')}
                disabled={index === 0 || isPending}
                className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
                title="위로 이동"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono px-1 text-slate-500 min-w-5 text-center">
                {node.sortOrder}
              </span>
              <button
                type="button"
                onClick={() => handleMoveOrder(siblings, index, 'down')}
                disabled={index === siblings.length - 1 || isPending}
                className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
                title="아래로 이동"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Active / Inactive Status Toggle */}
            <button
              type="button"
              onClick={() => handleToggleStatus(node)}
              disabled={isPending}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition ${
                node.isActive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 hover:bg-slate-200'
              }`}
              title={node.isActive ? '클릭하여 비공개로 변경' : '클릭하여 공개로 변경'}
            >
              {node.isActive ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>공개</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>숨김</span>
                </>
              )}
            </button>

            {/* Add Child Category Button (only if depth < 3) */}
            {node.depth < 3 && (
              <button
                type="button"
                onClick={() => handleOpenCreateModal(node.id)}
                disabled={isPending}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg border border-blue-200 dark:border-blue-900 transition"
                title="하위 카테고리 추가"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {node.depth === 1 ? '중분류 추가' : '소분류 추가'}
                </span>
              </button>
            )}

            {/* Edit Button */}
            <button
              type="button"
              onClick={() => handleOpenEditModal(node)}
              disabled={isPending}
              className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition"
              title="카테고리 정보 수정"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            {/* Delete Button / Confirm */}
            {deleteConfirmId === node.id ? (
              <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/80 p-1 rounded-lg border border-rose-200 dark:border-rose-900">
                <span className="text-[11px] text-rose-600 dark:text-rose-300 font-bold px-1">
                  삭제확인?
                </span>
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(node.id)}
                  disabled={isPending}
                  className="px-2 py-0.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-md transition"
                >
                  확인
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  disabled={isPending}
                  className="px-1.5 py-0.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  취소
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setDeleteConfirmId(node.id)}
                disabled={isPending}
                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                title="카테고리 삭제"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Child Nodes */}
        {hasChildren && isExpanded && (
          <div className="flex flex-col">
            {node.children.map((child, childIdx) =>
              renderCategoryNode(child, node.children, childIdx)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
              <FolderTree className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                카테고리 관리 (CMS)
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                대/중/소 3단계 계층 구조로 쇼핑몰 카테고리를 체계적으로 분류 및 관리합니다.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={refreshTree}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            새로고침
          </button>
          <button
            type="button"
            onClick={() => handleOpenCreateModal(null)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition shadow-blue-500/20"
          >
            <FolderPlus className="w-4 h-4" />
            대분류 카테고리 등록
          </button>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">총 카테고리</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {stats.total}
            <span className="text-xs font-normal text-slate-400 ml-1">개</span>
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">대분류 (1단계)</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {stats.depth1}
            <span className="text-xs font-normal text-slate-400 ml-1">개</span>
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">중분류 (2단계)</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {stats.depth2}
            <span className="text-xs font-normal text-slate-400 ml-1">개</span>
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-semibold text-purple-600 dark:text-purple-400">소분류 (3단계)</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {stats.depth3}
            <span className="text-xs font-normal text-slate-400 ml-1">개</span>
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs col-span-2 md:col-span-1">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">쇼핑몰 공개율</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.activeRate}%
            </span>
            <span className="text-xs text-slate-400">
              ({stats.active}/{stats.total})
            </span>
          </div>
        </div>
      </div>

      {/* 3. Alerts */}
      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center justify-between gap-3 text-rose-700 dark:text-rose-300 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-rose-500 hover:text-rose-700 font-bold"
          >
            닫기
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between gap-3 text-emerald-700 dark:text-emerald-300 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            className="text-emerald-500 hover:text-emerald-700 font-bold"
          >
            닫기
          </button>
        </div>
      )}

      {/* 4. Filter & Tree Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-850/40">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="카테고리명 또는 슬러그 검색..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={expandAll}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition"
            >
              모두 펼치기
            </button>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <button
              type="button"
              onClick={collapseAll}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition"
            >
              모두 접기
            </button>
          </div>
        </div>

        {/* Tree List */}
        {tree.length === 0 ? (
          <div className="py-16 text-center text-slate-400 dark:text-slate-500">
            <FolderTree className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-semibold">등록된 카테고리가 없습니다.</p>
            <p className="text-xs text-slate-400 mt-1">
              상단의 [대분류 카테고리 등록] 버튼을 눌러 첫 카테고리를 생성해보세요.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {tree.map((rootNode, idx) => renderCategoryNode(rootNode, tree, idx))}
          </div>
        )}
      </div>

      {/* 5. Editor Modal */}
      <CategoryEditorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={async () => {
          setActionSuccess(
            categoryToEdit
              ? `'${categoryToEdit.name}' 카테고리가 수정되었습니다.`
              : '새 카테고리가 성공적으로 등록되었습니다.'
          );
          await refreshTree();
        }}
        categoryToEdit={categoryToEdit}
        defaultParentId={defaultParentId}
        availableParents={availableParents}
      />
    </div>
  );
}

