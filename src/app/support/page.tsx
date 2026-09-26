import type { Metadata } from 'next';
import { CustomerSupportViewer } from '@/components/support/CustomerSupportViewer';

export const metadata: Metadata = {
  title: '고객센터 (Customer Support) | aramdream store',
  description: '자주 묻는 질문(FAQ), 1:1 맞춤 문의, 주문/배송 조회 및 취소/반품/교환 안내',
};

export default function SupportPage() {
  return (
    <div className="container-custom py-8 md:py-12">
      <CustomerSupportViewer />
    </div>
  );
}

