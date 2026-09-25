import type { Metadata } from 'next';
import { getStoreSettingsAction } from '@/app/actions/settings.actions';
import { StoreSettingsViewer } from '@/components/admin/settings/StoreSettingsViewer';
import type { StoreSettingsDTO } from '@/core/application/settings/dtos/StoreSettingsDTO';

export const metadata: Metadata = {
  title: '쇼핑몰 환경설정 | CommerceHub Admin',
  description: '스토어 기본 정보, 배송 정책, 회원 혜택 및 운영 상태 관리',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminSettingsPage() {
  const result = await getStoreSettingsAction();

  const fallbackSettings: StoreSettingsDTO = {
    id: 'default',
    storeName: 'CommerceHub 공식스토어',
    representativeName: '김은영',
    businessNumber: '214-88-91204',
    ecommercePermitNumber: '2024-서울강남-03891호',
    csPhone: '1588-4920',
    csEmail: 'support@commercehub.co.kr',
    address: '서울특별시 강남구 테헤란로 427, 위워크타워 14층 1402호',
    zipcode: '06164',
    logoHeaderUrl: null,
    logoMobileUrl: null,
    faviconUrl: null,
    isOperating: true,
    requireAdultVerification: false,
    allowGuestOrder: true,
    defaultShippingFee: 3000,
    freeShippingThreshold: 50000,
    islandMountainShippingFee: 3000,
    purchaseRewardRate: 1.5,
    textReviewReward: 500,
    photoReviewReward: 1500,
    welcomeReward: 3000,
    updatedAt: new Date().toISOString(),
    updatedBy: null,
  };

  const initialSettings = result.success && result.data ? result.data : fallbackSettings;

  return <StoreSettingsViewer initialSettings={initialSettings} />;
}
