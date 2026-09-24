import { Metadata } from 'next';
import { getAdminInquiriesAction } from '@/app/actions/inquiry.actions';
import { AdminInquiriesViewer } from '@/components/admin/AdminInquiriesViewer';

export const metadata: Metadata = {
  title: '1:1 문의 답변 관리 | 관리자 콘솔',
  description: '고객 1:1 문의 조회 및 관리자 답변 등록',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminInquiriesPage() {
  const result = await getAdminInquiriesAction();
  const inquiries = result.success && result.data ? result.data.inquiries : [];

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <AdminInquiriesViewer initialInquiries={inquiries} />
      </div>
    </div>
  );
}
