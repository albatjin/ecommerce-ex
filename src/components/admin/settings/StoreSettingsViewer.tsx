'use client';

import { useState, useTransition } from 'react';
import {
  Store,
  Truck,
  Coins,
  ShieldAlert,
  Save,
  CheckCircle2,
  AlertCircle,
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  Sparkles,
} from 'lucide-react';
import { updateStoreSettingsAction } from '@/app/actions/settings.actions';
import type { StoreSettingsDTO, UpdateStoreSettingsDTO } from '@/core/application/settings/dtos/StoreSettingsDTO';

interface StoreSettingsViewerProps {
  initialSettings: StoreSettingsDTO;
}

type TabType = 'general' | 'shipping' | 'reward' | 'policy';

export function StoreSettingsViewer({ initialSettings }: StoreSettingsViewerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [formData, setFormData] = useState<UpdateStoreSettingsDTO>({
    storeName: initialSettings.storeName,
    representativeName: initialSettings.representativeName,
    businessNumber: initialSettings.businessNumber,
    ecommercePermitNumber: initialSettings.ecommercePermitNumber,
    csPhone: initialSettings.csPhone,
    csEmail: initialSettings.csEmail,
    address: initialSettings.address,
    zipcode: initialSettings.zipcode,
    logoHeaderUrl: initialSettings.logoHeaderUrl,
    logoMobileUrl: initialSettings.logoMobileUrl,
    faviconUrl: initialSettings.faviconUrl,
    isOperating: initialSettings.isOperating,
    requireAdultVerification: initialSettings.requireAdultVerification,
    allowGuestOrder: initialSettings.allowGuestOrder,
    defaultShippingFee: initialSettings.defaultShippingFee,
    freeShippingThreshold: initialSettings.freeShippingThreshold,
    islandMountainShippingFee: initialSettings.islandMountainShippingFee,
    purchaseRewardRate: initialSettings.purchaseRewardRate,
    textReviewReward: initialSettings.textReviewReward,
    photoReviewReward: initialSettings.photoReviewReward,
    welcomeReward: initialSettings.welcomeReward,
  });

  const [lastUpdated, setLastUpdated] = useState<string>(initialSettings.updatedAt);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? checked
          : type === 'number'
          ? Number(value)
          : value,
    }));
  };

  const handleSave = () => {
    setFeedback(null);
    startTransition(async () => {
      const result = await updateStoreSettingsAction(formData);
      if (result.success && result.data) {
        setFeedback({
          type: 'success',
          text: '쇼핑몰 환경설정이 성공적으로 저장되었습니다.',
        });
        setLastUpdated(result.data.updatedAt);
      } else {
        setFeedback({
          type: 'error',
          text: result.error || '환경설정 저장 중 오류가 발생했습니다.',
        });
      }
    });
  };

  const tabs = [
    { id: 'general', label: '기본 & 사업자 정보', icon: Building2 },
    { id: 'shipping', label: '배송 정책 설정', icon: Truck },
    { id: 'reward', label: '적립금 & 혜택', icon: Coins },
    { id: 'policy', label: '운영 & 보안 정책', icon: ShieldAlert },
  ] as const;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 1. 상단 타이틀 & 설명 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Store className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            쇼핑몰 환경설정
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            스토어 기본 정보, 배송비 기준, 회원 혜택 및 운영 상태를 관리합니다.
          </p>
        </div>

        {/* 저장 버튼 및 수정 일시 */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[11px] text-slate-400 block">최근 갱신일시</span>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
              {new Date(lastUpdated).toLocaleString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            {isPending ? (
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isPending ? '저장 중...' : '설정 저장하기'}</span>
          </button>
        </div>
      </div>

      {/* 2. 피드백 배너 */}
      {feedback && (
        <div
          role="status"
          className={`p-4 rounded-xl text-sm flex items-center gap-3 transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          )}
          <span className="font-semibold">{feedback.text}</span>
        </div>
      )}

      {/* 3. 탭 내비게이션 바 */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                active
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. 탭별 상세 폼 카드 */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
        {/* Tab 1: 기본 및 사업자 정보 */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-500" /> 사업자 및 고객센터 정보
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                전자상거래법에 의거하여 쇼핑몰 하단 푸터 및 영수증에 의무적으로 표기되는 정보입니다.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="storeName" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  스토어 공식 상호명 <span className="text-rose-500">*</span>
                </label>
                <input
                  id="storeName"
                  name="storeName"
                  type="text"
                  value={formData.storeName}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:border-indigo-500 focus:outline-none"
                  placeholder="예: aramdream store"
                />
              </div>

              <div>
                <label htmlFor="representativeName" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  대표자명 <span className="text-rose-500">*</span>
                </label>
                <input
                  id="representativeName"
                  name="representativeName"
                  type="text"
                  value={formData.representativeName}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:border-indigo-500 focus:outline-none"
                  placeholder="예: 김은영"
                />
              </div>

              <div>
                <label htmlFor="businessNumber" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  사업자등록번호
                </label>
                <input
                  id="businessNumber"
                  name="businessNumber"
                  type="text"
                  value={formData.businessNumber}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:border-indigo-500 focus:outline-none"
                  placeholder="예: 214-88-91204"
                />
              </div>

              <div>
                <label htmlFor="ecommercePermitNumber" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  통신판매업신고번호
                </label>
                <input
                  id="ecommercePermitNumber"
                  name="ecommercePermitNumber"
                  type="text"
                  value={formData.ecommercePermitNumber}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:border-indigo-500 focus:outline-none"
                  placeholder="예: 2024-서울강남-03891호"
                />
              </div>

              <div>
                <label htmlFor="csPhone" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  고객센터 대표전화 <span className="text-slate-400 font-normal">(CS Phone)</span>
                </label>
                <div className="relative">
                  <input
                    id="csPhone"
                    name="csPhone"
                    type="text"
                    value={formData.csPhone}
                    onChange={handleInputChange}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:border-indigo-500 focus:outline-none"
                    placeholder="예: 1588-4920"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label htmlFor="csEmail" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  고객센터 이메일 <span className="text-slate-400 font-normal">(CS Email)</span>
                </label>
                <div className="relative">
                  <input
                    id="csEmail"
                    name="csEmail"
                    type="email"
                    value={formData.csEmail}
                    onChange={handleInputChange}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:border-indigo-500 focus:outline-none"
                    placeholder="예: support@commercehub.co.kr"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  사업장 소재지 주소 & 우편번호
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input
                    id="zipcode"
                    name="zipcode"
                    type="text"
                    value={formData.zipcode}
                    onChange={handleInputChange}
                    className="sm:col-span-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:border-indigo-500 focus:outline-none"
                    placeholder="우편번호 (06164)"
                  />
                  <div className="sm:col-span-3 relative">
                    <input
                      id="address"
                      name="address"
                      type="text"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:border-indigo-500 focus:outline-none"
                      placeholder="기본 도로명 주소"
                    />
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: 배송 정책 설정 */}
        {activeTab === 'shipping' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-indigo-500" /> 쇼핑몰 통합 배송비 정책
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                장바구니 무료배송 게이지 및 결제 시 자동으로 부과되는 배송비를 설정합니다.
              </p>
            </div>

            {/* 배송 정책 실시간 미리보기 카드 */}
            <div className="p-4 bg-linear-to-r from-blue-500/10 via-indigo-500/5 to-transparent rounded-xl border border-blue-200 dark:border-blue-900/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-blue-900 dark:text-blue-300 block">
                  현재 적용 배송 안내 프리뷰
                </span>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
                  기본 배송비 <span className="text-indigo-600 font-bold">{formData.defaultShippingFee.toLocaleString()}원</span> (
                  <span className="text-emerald-600 font-bold">{formData.freeShippingThreshold.toLocaleString()}원</span> 이상 주문 시 무료배송, 도서산간 +{formData.islandMountainShippingFee.toLocaleString()}원)
                </p>
              </div>
              <Sparkles className="w-5 h-5 text-blue-500 hidden sm:block" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label htmlFor="defaultShippingFee" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  기본 배송비 (원) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="defaultShippingFee"
                    name="defaultShippingFee"
                    type="number"
                    min="0"
                    step="500"
                    value={formData.defaultShippingFee}
                    onChange={handleInputChange}
                    className="w-full pr-9 pl-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-xs text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 font-semibold">
                    원
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="freeShippingThreshold" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  무료배송 기준 금액 (원) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="freeShippingThreshold"
                    name="freeShippingThreshold"
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.freeShippingThreshold}
                    onChange={handleInputChange}
                    className="w-full pr-9 pl-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-emerald-600 dark:text-emerald-400 focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-xs text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 font-semibold">
                    원
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">0원 설정 시 전 상품 무료배송</span>
              </div>

              <div>
                <label htmlFor="islandMountainShippingFee" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  제주/도서산간 추가 배송비 (원)
                </label>
                <div className="relative">
                  <input
                    id="islandMountainShippingFee"
                    name="islandMountainShippingFee"
                    type="number"
                    min="0"
                    step="500"
                    value={formData.islandMountainShippingFee}
                    onChange={handleInputChange}
                    className="w-full pr-9 pl-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-xs text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 font-semibold">
                    원
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: 적립금 & 혜택 정책 */}
        {activeTab === 'reward' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-500" /> 리워드 포인트 및 프로모션 정책
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                신규 가입 환영 적립금, 구매 적립률, 리뷰 작성 보상 포인트를 설정합니다.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20">
                <label htmlFor="welcomeReward" className="block text-xs font-bold text-amber-900 dark:text-amber-300 mb-1.5">
                  🎉 신규 회원가입 웰컴 적립금 (원)
                </label>
                <div className="relative">
                  <input
                    id="welcomeReward"
                    name="welcomeReward"
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.welcomeReward}
                    onChange={handleInputChange}
                    className="w-full pr-9 pl-3.5 py-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-sm font-black text-amber-600 dark:text-amber-400 focus:border-amber-500 focus:outline-none"
                  />
                  <span className="text-xs text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 font-semibold">
                    원
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                  가입 즉시 고객 계정에 자동 지급되는 포인트입니다.
                </span>
              </div>

              <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-950/20">
                <label htmlFor="purchaseRewardRate" className="block text-xs font-bold text-indigo-900 dark:text-indigo-300 mb-1.5">
                  🛍️ 기본 상품 구매 적립률 (%)
                </label>
                <div className="relative">
                  <input
                    id="purchaseRewardRate"
                    name="purchaseRewardRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.purchaseRewardRate}
                    onChange={handleInputChange}
                    className="w-full pr-9 pl-3.5 py-2.5 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-800 text-sm font-black text-indigo-600 dark:text-indigo-400 focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-xs text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 font-semibold">
                    %
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                  실결제 완료 시 구매 금액에 비례하여 적립되는 비율입니다.
                </span>
              </div>

              <div>
                <label htmlFor="textReviewReward" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  ✍️ 일반 텍스트 리뷰 적립금 (원)
                </label>
                <div className="relative">
                  <input
                    id="textReviewReward"
                    name="textReviewReward"
                    type="number"
                    min="0"
                    step="100"
                    value={formData.textReviewReward}
                    onChange={handleInputChange}
                    className="w-full pr-9 pl-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-xs text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 font-semibold">
                    원
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="photoReviewReward" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  📸 포토/동영상 리뷰 적립금 (원)
                </label>
                <div className="relative">
                  <input
                    id="photoReviewReward"
                    name="photoReviewReward"
                    type="number"
                    min="0"
                    step="500"
                    value={formData.photoReviewReward}
                    onChange={handleInputChange}
                    className="w-full pr-9 pl-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-xs text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 font-semibold">
                    원
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: 운영 & 보안 정책 */}
        {activeTab === 'policy' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-500" /> 상점 운영 및 보안 통제
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                쇼핑몰 전체 주문 활성화 여부 및 비회원 주문 정책을 설정합니다.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <div className="space-y-0.5">
                  <span className="text-sm font-bold text-slate-900 dark:text-white block">
                    쇼핑몰 정상 운영 상태 (Operating Status)
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    비활성화 시 고객 주문이 일시 정지되며 시스템 점검 중 안내 배너가 표시됩니다.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="isOperating"
                    checked={formData.isOperating}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <div className="space-y-0.5">
                  <span className="text-sm font-bold text-slate-900 dark:text-white block">
                    비회원 게스트 주문 허용 (Allow Guest Checkout)
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    로그인하지 않은 방문자도 이메일 및 휴대폰 인증을 통해 상품을 구매할 수 있습니다.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="allowGuestOrder"
                    checked={formData.allowGuestOrder}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <div className="space-y-0.5">
                  <span className="text-sm font-bold text-slate-900 dark:text-white block">
                    성인 인증(19세 이상) 필수 모드
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    주류, 성인용품 등 연령 확인이 필요한 카탈로그 주문 시 본인인증을 강제합니다.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="requireAdultVerification"
                    checked={formData.requireAdultVerification}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* 5. 폼 하단 저장 버튼 */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            {isPending ? (
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isPending ? '저장 처리 중...' : '변경된 설정 저장'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
