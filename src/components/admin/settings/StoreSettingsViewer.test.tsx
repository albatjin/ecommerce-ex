import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StoreSettingsViewer } from './StoreSettingsViewer';
import type { StoreSettingsDTO } from '@/core/application/settings/dtos/StoreSettingsDTO';

const mockUpdateAction = vi.fn();
vi.mock('@/app/actions/settings.actions', () => ({
  updateStoreSettingsAction: (...args: unknown[]) => mockUpdateAction(...args),
}));

const mockInitialSettings: StoreSettingsDTO = {
  id: 'default',
  storeName: 'aramdream store',
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
  updatedAt: '2026-09-25T00:00:00.000Z',
  updatedBy: null,
};

describe('StoreSettingsViewer Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('기본 탭에서 사업자 및 고객센터 정보를 렌더링한다', () => {
    render(<StoreSettingsViewer initialSettings={mockInitialSettings} />);

    expect(screen.getByText('쇼핑몰 환경설정')).toBeInTheDocument();
    expect(screen.getByDisplayValue('aramdream store')).toBeInTheDocument();
    expect(screen.getByDisplayValue('김은영')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1588-4920')).toBeInTheDocument();
  });

  it('탭 클릭 시 해당 정책 설정 화면으로 전환된다', async () => {
    render(<StoreSettingsViewer initialSettings={mockInitialSettings} />);

    // 배송 정책 탭 클릭
    const shippingTab = screen.getByRole('button', { name: /배송 정책 설정/i });
    fireEvent.click(shippingTab);

    expect(screen.getByText('쇼핑몰 통합 배송비 정책')).toBeInTheDocument();
    expect(screen.getByLabelText(/기본 배송비/i)).toHaveValue(3000);
    expect(screen.getByLabelText(/무료배송 기준 금액/i)).toHaveValue(50000);

    // 적립금 & 혜택 탭 클릭
    const rewardTab = screen.getByRole('button', { name: /적립금 & 혜택/i });
    fireEvent.click(rewardTab);

    expect(screen.getByText('리워드 포인트 및 프로모션 정책')).toBeInTheDocument();
    expect(screen.getByLabelText(/기본 상품 구매 적립률/i)).toHaveValue(1.5);

    // 운영 & 보안 탭 클릭
    const policyTab = screen.getByRole('button', { name: /운영 & 보안 정책/i });
    fireEvent.click(policyTab);

    expect(screen.getByText('상점 운영 및 보안 통제')).toBeInTheDocument();
  });

  it('설정 변경 후 저장 버튼 클릭 시 액션이 호출되고 성공 피드백을 노출한다', async () => {
    mockUpdateAction.mockResolvedValueOnce({
      success: true,
      data: {
        ...mockInitialSettings,
        storeName: '수정된 스토어명',
        updatedAt: '2026-09-25T12:00:00.000Z',
      },
    });

    render(<StoreSettingsViewer initialSettings={mockInitialSettings} />);

    const storeNameInput = screen.getByLabelText(/스토어 공식 상호명/i);
    fireEvent.change(storeNameInput, { target: { value: '수정된 스토어명' } });

    const saveButtons = screen.getAllByRole('button', { name: /설정 저장/i });
    fireEvent.click(saveButtons[0]);

    await waitFor(() => {
      expect(mockUpdateAction).toHaveBeenCalledTimes(1);
      expect(
        screen.getByText('쇼핑몰 환경설정이 성공적으로 저장되었습니다.')
      ).toBeInTheDocument();
    });
  });

  it('저장 실패 시 오류 피드백을 노출한다', async () => {
    mockUpdateAction.mockResolvedValueOnce({
      success: false,
      error: '권한이 없습니다.',
    });

    render(<StoreSettingsViewer initialSettings={mockInitialSettings} />);

    const saveButtons = screen.getAllByRole('button', { name: /설정 저장/i });
    fireEvent.click(saveButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('권한이 없습니다.')).toBeInTheDocument();
    });
  });
});
