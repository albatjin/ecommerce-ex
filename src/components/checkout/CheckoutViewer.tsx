'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  Truck,
  Tag,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Building,
  Smartphone,
} from 'lucide-react';
import type { PaymentMethod } from '@/shared/types/database.types';
import type {
  CheckoutDataDTO,
  CheckoutShippingInput,
} from '@/core/application/order/dtos/CheckoutDTO';
import { createOrderAction } from '@/app/actions/order.actions';

interface CheckoutViewerProps {
  initialData: CheckoutDataDTO;
  onPlaceOrder?: (data: {
    shippingAddress: CheckoutShippingInput;
    paymentMethod: PaymentMethod;
    couponId?: string | null;
    pointsToUse?: number;
  }) => Promise<void>;
}

const SHIPPING_MESSAGES = [
  '배송 요청사항을 선택해 주세요',
  '부재 시 문 앞에 놓아주세요',
  '배송 전에 미리 연락 바랍니다',
  '경비실에 맡겨 주세요',
  '택배함에 보관해 주세요',
  '직접 입력',
];

export function CheckoutViewer({
  initialData,
  onPlaceOrder,
}: CheckoutViewerProps) {
  const router = useRouter();

  // 1. 배송지 상태
  const [recipientName, setRecipientName] = useState(
    initialData.defaultShippingAddress?.recipientName || ''
  );
  const [recipientPhone, setRecipientPhone] = useState(
    initialData.defaultShippingAddress?.recipientPhone || ''
  );
  const [zipcode, setZipcode] = useState(
    initialData.defaultShippingAddress?.zipcode || ''
  );
  const [address, setAddress] = useState(
    initialData.defaultShippingAddress?.address || ''
  );
  const [selectedMessage, setSelectedMessage] = useState(SHIPPING_MESSAGES[1]);
  const [customMessage, setCustomMessage] = useState('');

  // 2. 할인/쿠폰/적립금 상태
  const [selectedCouponId, setSelectedCouponId] = useState<string>('');
  const [pointsInput, setPointsInput] = useState<number>(0);

  // 3. 결제 수단 상태
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod>('CREDIT_CARD');

  // 4. UI 접기/펼치기 상태
  const [isItemListOpen, setIsItemListOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 선택된 쿠폰 정보 및 할인액 계산
  const selectedCoupon = useMemo(() => {
    return initialData.availableCoupons.find((c) => c.id === selectedCouponId);
  }, [initialData.availableCoupons, selectedCouponId]);

  const couponDiscount = useMemo(() => {
    if (!selectedCoupon || !selectedCoupon.isUsable) return 0;
    return selectedCoupon.calculatedDiscount;
  }, [selectedCoupon]);

  // 남은 금액 및 최대 적립금 계산
  const remainingAfterCoupon = Math.max(
    0,
    initialData.productTotal - couponDiscount
  );
  const maxPointsAvailable = Math.min(
    initialData.availablePoints,
    remainingAfterCoupon
  );

  const appliedPoints = Math.min(Math.max(0, pointsInput), maxPointsAvailable);
  const totalDiscount = couponDiscount + appliedPoints;
  const finalPaymentAmount =
    Math.max(0, initialData.productTotal - totalDiscount) +
    initialData.shippingFee;
  const expectedPointsEarn = Math.floor(
    Math.max(0, initialData.productTotal - totalDiscount) * 0.01
  );

  // 적립금 전액 사용 버튼 핸들러
  const handleUseAllPoints = () => {
    setPointsInput(maxPointsAvailable);
  };

  const handlePointsChange = (val: string) => {
    const num = parseInt(val.replace(/[^0-9]/g, ''), 10) || 0;
    if (num > maxPointsAvailable) {
      setPointsInput(maxPointsAvailable);
    } else {
      setPointsInput(num);
    }
  };

  // 주문 제출 핸들러
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!recipientName.trim()) {
      setErrorMessage('수령인 이름을 입력해 주세요.');
      return;
    }
    if (!recipientPhone.trim()) {
      setErrorMessage('수령인 연락처를 입력해 주세요.');
      return;
    }
    if (!zipcode.trim() || !address.trim()) {
      setErrorMessage('배송지 주소와 우편번호를 입력해 주세요.');
      return;
    }

    const finalMessage =
      selectedMessage === '직접 입력'
        ? customMessage.trim()
        : selectedMessage === SHIPPING_MESSAGES[0]
        ? ''
        : selectedMessage;

    setIsSubmitting(true);
    try {
      if (onPlaceOrder) {
        await onPlaceOrder({
          shippingAddress: {
            recipientName: recipientName.trim(),
            recipientPhone: recipientPhone.trim(),
            zipcode: zipcode.trim(),
            address: address.trim(),
            message: finalMessage,
          },
          paymentMethod: selectedPaymentMethod,
          couponId: selectedCouponId || null,
          pointsToUse: appliedPoints,
        });
      } else {
        const res = await createOrderAction({
          shippingAddress: {
            recipientName: recipientName.trim(),
            recipientPhone: recipientPhone.trim(),
            zipcode: zipcode.trim(),
            address: address.trim(),
            message: finalMessage,
          },
          paymentMethod: selectedPaymentMethod,
          couponId: selectedCouponId || null,
          pointsToUse: appliedPoints,
        });

        if (!res.success) {
          setErrorMessage(res.error || '주문 처리 중 오류가 발생했습니다.');
          return;
        }

        alert(`주문이 안전하게 접수되었습니다! (주문번호: ${res.data?.orderNumber})`);
        router.push('/');
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : '주문 처리 중 오류가 발생했습니다.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-custom py-8 sm:py-12">
      {/* 1. 상단 브레드크럼 & 타이틀 */}
      <nav
        className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-6"
        aria-label="현재 위치"
      >
        <Link href="/" className="hover:text-blue-600 transition-colors">
          홈
        </Link>
        <span>/</span>
        <Link href="/cart" className="hover:text-blue-600 transition-colors">
          장바구니
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-800 dark:text-slate-200">
          주문서 작성
        </span>
      </nav>

      <div className="flex items-baseline justify-between mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          주문 / 결제
        </h1>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. 2컬럼 레이아웃 */}
      <form noValidate onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* 좌측 입력 영역 (8/12) */}
        <div className="lg:col-span-8 space-y-6">
          {/* 섹션 1: 주문 상품 목록 미리보기 (아코디언) */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <button
              type="button"
              onClick={() => setIsItemListOpen((prev) => !prev)}
              className="w-full flex items-center justify-between text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  주문 상품 목록 ({initialData.items.length}건)
                </h2>
                <span className="text-xs text-slate-500">
                  총 {initialData.items.reduce((s, i) => s + i.quantity, 0)}개
                </span>
              </div>
              {isItemListOpen ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>

            {isItemListOpen && (
              <div className="mt-5 space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                {initialData.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80"
                  >
                    <div className="w-16 h-16 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 border border-slate-200/60 dark:border-slate-700">
                      {item.coverImageUrl ? (
                        <img
                          src={item.coverImageUrl}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                          No Img
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {item.productName}
                      </p>
                      {item.variantName && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          옵션: {item.variantName}
                        </p>
                      )}
                      <p className="text-xs text-slate-500">
                        {item.price.toLocaleString()}원 × {item.quantity}개
                      </p>
                    </div>
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      {item.subtotal.toLocaleString()}원
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 섹션 2: 배송지 정보 입력 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                배송지 정보
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="recipientName"
                  className="text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  수령인 이름 <span className="text-red-500">*</span>
                </label>
                <input
                  id="recipientName"
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="받으실 분 성함"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="recipientPhone"
                  className="text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  연락처 <span className="text-red-500">*</span>
                </label>
                <input
                  id="recipientPhone"
                  type="tel"
                  required
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="010-0000-0000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            {/* 우편번호 & 주소 */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="w-36 space-y-1.5">
                  <label
                    htmlFor="zipcode"
                    className="text-xs font-bold text-slate-700 dark:text-slate-300"
                  >
                    우편번호 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="zipcode"
                    type="text"
                    required
                    value={zipcode}
                    onChange={(e) => setZipcode(e.target.value)}
                    placeholder="06234"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="address"
                  className="text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  주소 및 상세주소 <span className="text-red-500">*</span>
                </label>
                <input
                  id="address"
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="도로명 주소 및 동/호수"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            {/* 배송 요청사항 */}
            <div className="space-y-2">
              <label
                htmlFor="shippingMessageSelect"
                className="text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                배송 요청사항
              </label>
              <select
                id="shippingMessageSelect"
                value={selectedMessage}
                onChange={(e) => setSelectedMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                {SHIPPING_MESSAGES.map((msg) => (
                  <option key={msg} value={msg}>
                    {msg}
                  </option>
                ))}
              </select>

              {selectedMessage === '직접 입력' && (
                <input
                  type="text"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="요청사항을 직접 입력하세요 (최대 50자)"
                  maxLength={50}
                  className="w-full mt-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:border-blue-600"
                />
              )}
            </div>
          </div>

          {/* 섹션 3: 쿠폰 & 적립금 할인 적용 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Tag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                할인 혜택 적용
              </h2>
            </div>

            {/* 1. 쿠폰 선택 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  쿠폰 할인 (보유 {initialData.availableCoupons.length}장)
                </span>
                {selectedCoupon && (
                  <span className="text-blue-600 dark:text-blue-400 font-bold">
                    -{couponDiscount.toLocaleString()}원 적용됨
                  </span>
                )}
              </div>

              <select
                id="couponSelect"
                value={selectedCouponId}
                onChange={(e) => setSelectedCouponId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                <option value="">쿠폰을 선택해 주세요 (적용 안 함)</option>
                {initialData.availableCoupons.map((coupon) => (
                  <option
                    key={coupon.id}
                    value={coupon.id}
                    disabled={!coupon.isUsable}
                  >
                    {coupon.name} (
                    {coupon.isUsable
                      ? `-${coupon.calculatedDiscount.toLocaleString()}원 할인`
                      : coupon.unusableReason}
                    )
                  </option>
                ))}
              </select>
            </div>

            {/* 2. 적립금 사용 */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  적립금 사용
                </span>
                <span className="text-slate-500">
                  보유 포인트:{' '}
                  <strong className="text-slate-900 dark:text-white font-bold">
                    {initialData.availablePoints.toLocaleString()}P
                  </strong>
                </span>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={pointsInput > 0 ? pointsInput.toLocaleString() : ''}
                    onChange={(e) => handlePointsChange(e.target.value)}
                    placeholder="0"
                    className="w-full pl-3.5 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:border-blue-600 text-right font-mono"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    P
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleUseAllPoints}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer shrink-0"
                >
                  전액 사용
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                * 최대 {maxPointsAvailable.toLocaleString()}P까지 사용 가능합니다.
              </p>
            </div>
          </div>

          {/* 섹션 4: 결제 수단 선택 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                결제 수단 선택
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { id: 'CREDIT_CARD', label: '신용/체크카드', icon: CreditCard },
                { id: 'NAVER_PAY', label: '네이버페이', icon: Sparkles },
                { id: 'KAKAO_PAY', label: '카카오페이', icon: Sparkles },
                { id: 'TOSS_PAY', label: '토스페이', icon: Sparkles },
                { id: 'VIRTUAL_ACCOUNT', label: '가상계좌', icon: Building },
                { id: 'MOBILE', label: '휴대폰 결제', icon: Smartphone },
              ].map((item) => {
                const isSelected = selectedPaymentMethod === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      setSelectedPaymentMethod(item.id as PaymentMethod)
                    }
                    className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between h-20 transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <Icon className="w-5 h-5" />
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <span className="text-xs font-bold">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 우측 결제 요약 패널 (4/12 Sticky) */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              최종 결제 금액
            </h2>

            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>총 주문 상품금액</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {initialData.productTotal.toLocaleString()}원
                </span>
              </div>

              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>배송비</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {initialData.shippingFee === 0 ? (
                    <span className="text-blue-600 dark:text-blue-400 font-bold">
                      무료
                    </span>
                  ) : (
                    `${initialData.shippingFee.toLocaleString()}원`
                  )}
                </span>
              </div>

              {couponDiscount > 0 && (
                <div className="flex justify-between text-blue-600 dark:text-blue-400">
                  <span>쿠폰 할인</span>
                  <span className="font-bold">
                    -{couponDiscount.toLocaleString()}원
                  </span>
                </div>
              )}

              {appliedPoints > 0 && (
                <div className="flex justify-between text-blue-600 dark:text-blue-400">
                  <span>적립금 사용</span>
                  <span className="font-bold">
                    -{appliedPoints.toLocaleString()}P
                  </span>
                </div>
              )}

              {/* 구매 적립 포인트 */}
              <div className="pt-2 flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 border-t border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  구매 적립 예정
                </span>
                <span className="font-bold">
                  +{expectedPointsEarn.toLocaleString()}P (1%)
                </span>
              </div>

              {/* 최종 결제 금액 */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-baseline">
                <span className="text-base font-extrabold text-slate-900 dark:text-white">
                  최종 결제 금액
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
                    {finalPaymentAmount.toLocaleString()}
                  </span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    원
                  </span>
                </div>
              </div>
            </div>

            {/* 주문 및 결제 버튼 */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              <span>
                {isSubmitting
                  ? '결제 승인 중...'
                  : `${finalPaymentAmount.toLocaleString()}원 결제하기`}
              </span>
            </button>

            {/* 보안 및 이용약관 배지 */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>주문 내용을 확인하였으며 결제에 동의합니다.</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>안전한 256비트 SSL 암호화 결제 보호</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
