import type { Metadata } from 'next';
import { getAdminCategoryTreeAction } from '@/app/actions/category-admin.actions';
import { AdminCategoryListViewer } from '@/components/admin/categories/AdminCategoryListViewer';

export const metadata: Metadata = {
  title: '카테고리 관리 (CMS) | aramdream store Admin',
  description: '대/중/소 3단계 계층형 카테고리 트리 시각화 및 등록/수정/삭제/노출 순서 관리',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminCategoriesPage() {
  const result = await getAdminCategoryTreeAction();
  const tree = result.success && result.data ? result.data : [];

  return <AdminCategoryListViewer initialTree={tree} />;
}

