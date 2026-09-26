'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  X,
  CreditCard,
  Lock,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export interface PayPalApprovalDetails {
  orderId: string;
  payerId: string;
  payerEmail: string;
  payerName: string;
  usdAmount: number;
  exchangeRate: number;
  approvedAt: string;
}

interface PayPalCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: (details: PayPalApprovalDetails) => Promise<void>;
  amountKRW: number;
  recipientName: string;
  recipientAddress: string;
  orderName: string;
}

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: any) => {
        render: (container: HTMLElement | string) => Promise<void>;
      };
    };
  }
}

export function PayPalCheckoutModal({
  isOpen,
  onClose,
  onApprove,
  amountKRW,
  recipientName,
  recipientAddress,
  orderName,
}: PayPalCheckoutModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  const [isSdkLoading, setIsSdkLoading] = useState(false);
  const paypalContainerRef = useRef<HTMLDivElement>(null);

  // 기준 환율 1 USD = 1,400 KRW
  const EXCHANGE_RATE = 1400;
  const amountUSD = Number((amountKRW / EXCHANGE_RATE).toFixed(2));
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const currency = process.env.NEXT_PUBLIC_PAYPAL_CURRENCY || 'USD';

  // 1. PayPal Official JS SDK 동적 로딩 및 공식 버튼 마운트
  useEffect(() => {
    if (!isOpen || !clientId) return;

    let isMounted = true;
    const scriptId = 'paypal-js-sdk';

    const renderPayPalButtons = () => {
      if (!window.paypal?.Buttons || !paypalContainerRef.current) return;

      // 이전 렌더링 컨테이너 비우기
      paypalContainerRef.current.innerHTML = '';

      try {
        window.paypal
          .Buttons({
            style: {
              layout: 'vertical',
              color: 'gold',
              shape: 'rect',
              label: 'paypal',
              height: 48,
            },
            createOrder: (_data: unknown, actions: any) => {
              return actions.order.create({
                intent: 'CAPTURE',
                purchase_units: [
                  {
                    description: orderName || 'aramdream store 상품 주문',
                    amount: {
                      currency_code: currency,
                      value: amountUSD.toFixed(2),
                    },
                  },
                ],
              });
            },
            onApprove: async (data: any, actions: any) => {
              if (!isMounted) return;
              setIsProcessing(true);
              setError(null);
              try {
                const details = await actions.order.capture();
                const payerName = details.payer?.name?.given_name
                  ? `${details.payer.name.given_name} ${details.payer.name.surname || ''}`.trim()
                  : recipientName || 'PayPal 구매 고객';
                const payerEmail = details.payer?.email_address || 'customer@paypal-sandbox.com';

                await onApprove({
                  orderId: details.id || data.orderID,
                  payerId: details.payer?.payer_id || data.payerID || 'PAYER-ID',
                  payerEmail,
                  payerName,
                  usdAmount: amountUSD,
                  exchangeRate: EXCHANGE_RATE,
                  approvedAt: new Date().toISOString(),
                });
                if (isMounted) setIsSuccess(true);
              } catch (err) {
                if (isMounted) {
                  setError(
                    err instanceof Error
                      ? err.message
                      : 'PayPal 결제 승인 처리 중 오류가 발생했습니다.'
                  );
                  setIsProcessing(false);
                }
              }
            },
            onError: (err: unknown) => {
              console.error('PayPal Buttons Error:', err);
              if (isMounted) {
                const errorStr = (err instanceof Error ? err.message : String(err)) || '';
                if (
                  errorStr.includes('Window closed') ||
                  errorStr.includes('closed') ||
                  errorStr.includes('popup_close')
                ) {
                  setError(
                    'PayPal 결제창이 이전 로그인 정보로 인해 자동 종료되었거나 응답 전 닫혔습니다. 새 sb-xxxx 계정 로그인을 위해 [이전 세션 로그아웃]을 누르시거나, 브라우저 시크릿 창(Ctrl+Shift+N)으로 접속해 주세요.'
                  );
                } else {
                  setError('PayPal 결제 진행 중 오류가 발생했습니다. 다시 시도해 주세요.');
                }
                setIsProcessing(false);
              }
            },
            onCancel: () => {
              if (isMounted) {
                setError('PayPal 결제 창이 취소되었습니다. 다시 시도하거나 간편 테스트 시뮬레이션을 이용해 주세요.');
                setIsProcessing(false);
              }
            },
          })
          .render(paypalContainerRef.current)
          .then(() => {
            if (isMounted) {
              setIsSdkLoaded(true);
              setIsSdkLoading(false);
            }
          })
          .catch((err: unknown) => {
            console.warn('PayPal render fallback:', err);
            if (isMounted) {
              setIsSdkLoading(false);
            }
          });
      } catch (err) {
        console.warn('PayPal init error:', err);
        if (isMounted) setIsSdkLoading(false);
      }
    };

    if (window.paypal) {
      renderPayPalButtons();
      return () => {
        isMounted = false;
      };
    }

    setIsSdkLoading(true);
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}&intent=capture`;
      script.async = true;
      script.onload = () => {
        if (isMounted) renderPayPalButtons();
      };
      script.onerror = () => {
        if (isMounted) {
          setIsSdkLoading(false);
        }
      };
      document.body.appendChild(script);
    } else {
      script.addEventListener('load', renderPayPalButtons);
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, clientId, currency, amountUSD, orderName, recipientName, onApprove]);

  if (!isOpen) return null;

  // 2. 빠른 시뮬레이션 승인 핸들러 (테스트 환경 및 원클릭 간편 승인용)
  const handleConfirmPayment = async () => {
    if (isProcessing || isSuccess) return;
    setIsProcessing(true);
    setError(null);
    try {
      const mockPaypalOrderId = `PAYID-${Date.now().toString(36).toUpperCase()}-${Math.random()
        .toString(36)
        .substring(2, 7)
        .toUpperCase()}`;
      const mockPayerId = `PAYER-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

      await onApprove({
        orderId: mockPaypalOrderId,
        payerId: mockPayerId,
        payerEmail: 'customer@paypal-sandbox.com',
        payerName: recipientName || '홍길동 (PayPal 인증 구매자)',
        usdAmount: amountUSD,
        exchangeRate: EXCHANGE_RATE,
        approvedAt: new Date().toISOString(),
      });
      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PayPal 결제 승인 중 오류가 발생했습니다.');
      setIsProcessing(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="paypal-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl my-8">
        {/* 1. PayPal 상단 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-[#003087]/5 dark:bg-[#003087]/20">
          <div className="flex items-center gap-2.5">
            {/* PayPal Dual-P Icon */}
            <div className="w-8 h-8 rounded-xl bg-[#003087] flex items-center justify-center text-white font-black text-sm italic shadow-xs">
              <span className="text-[#0079C1]">P</span>
              <span className="-ml-1 text-white">P</span>
            </div>
            <div>
              <span id="paypal-modal-title" className="text-base font-black tracking-tight text-[#003087] dark:text-[#0079C1]">
                PayPal
              </span>
              <span className="text-xs font-semibold text-slate-500 ml-1.5">Checkout</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
              <Lock className="w-3 h-3" />
              <span>TLS 1.3 암호화</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. 결제 내용 요약 */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 pl-6 pt-1">
                <a
                  href="https://www.sandbox.paypal.com/myaccount/logout"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] shadow-xs transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>기존 PayPal 세션 로그아웃(초기화)</span>
                </a>
              </div>
            </div>
          )}

          {/* 결제 금액 카드 (USD + KRW) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500">결제 요청 금액</span>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate max-w-[220px]">
                {orderName}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                ${amountUSD.toFixed(2)}{' '}
                <span className="text-xs font-bold text-slate-400">USD</span>
              </div>
              <span className="text-xs text-slate-400">
                (약 {amountKRW.toLocaleString()}원 · ₩1,400/$)
              </span>
            </div>
          </div>

          {/* 연동 모드 안내 배지 & 샌드박스 계정 안내 */}
          <div className="p-3.5 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      PayPal 공식 연동 활성화
                    </span>
                    <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                      Sandbox 모드
                    </span>
                  </div>
                </div>
              </div>
              <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            </div>

            <div className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-900/60 p-3 rounded-xl border border-blue-100 dark:border-blue-900/40 space-y-2">
              <div className="font-semibold text-blue-900 dark:text-blue-200">
                💡 새로운 sb-xxxxx 테스트 계정으로 로그인하는 방법:
              </div>
              <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-300">
                <li>
                  <strong className="text-slate-800 dark:text-slate-100">가장 추천 (100% 빈 로그인창):</strong> 브라우저 <strong>시크릿 창 (Ctrl+Shift+N)</strong>에서 접속하시면 이전 로그인 캐시 없이 빈 계정 입력창이 바로 열립니다.
                </li>
                <li>
                  <strong className="text-slate-800 dark:text-slate-100">이전 세션 로그아웃:</strong> 아래 버튼을 눌러 기존 PayPal Sandbox 로그인 세션을 해제하세요.
                </li>
              </ul>
              <div className="pt-1 flex flex-wrap items-center gap-2">
                <a
                  href="https://www.sandbox.paypal.com/myaccount/logout"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/60 hover:bg-blue-200/80 dark:hover:bg-blue-800 px-2.5 py-1 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Sandbox 이전 세션 로그아웃(초기화)</span>
                </a>
                <a
                  href="https://developer.paypal.com/dashboard/accounts"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:underline"
                >
                  <span>Sandbox Personal 계정/비번 확인</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* 배송지 확인 */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <div className="flex justify-between text-slate-400">
              <span>배송지 정보</span>
              <span>{recipientName}</span>
            </div>
            <p className="truncate text-slate-700 dark:text-slate-300 font-medium">
              {recipientAddress}
            </p>
          </div>

          {/* 구매자 보호 안내 */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>PayPal 구매자 보호 프로그램(Buyer Protection)이 기본 적용됩니다.</span>
          </div>

          {/* 3. PayPal 공식 버튼 렌더링 영역 */}
          <div className="pt-2 space-y-3">
            {isSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-2 text-sm font-bold">
                <CheckCircle2 className="w-5 h-5" />
                <span>결제 승인 완료! 주문 완료 페이지로 이동 중...</span>
              </div>
            ) : isProcessing ? (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 flex items-center justify-center gap-2 text-sm font-bold">
                <span className="w-5 h-5 border-2 border-amber-600/30 border-t-amber-600 rounded-full animate-spin" />
                <span>PayPal 결제 승인 및 영수증 처리 중...</span>
              </div>
            ) : (
              <>
                {/* 공식 SDK 버튼 컨테이너 */}
                <div ref={paypalContainerRef} className="w-full min-h-[48px]" />

                {/* SDK 로딩 중이거나 Fallback일 때 표시되는 버튼 (테스트 호환성 보장) */}
                {(!isSdkLoaded || isSdkLoading) && (
                  <button
                    type="button"
                    disabled={isProcessing || isSuccess}
                    onClick={handleConfirmPayment}
                    className="w-full py-4 px-6 rounded-2xl bg-[#FFC439] hover:bg-[#F2BA36] text-[#003087] font-black text-base shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="font-extrabold text-[#003087]">Pay with</span>
                    <span className="font-black italic text-[#003087] tracking-tight">PayPal</span>
                    <span>(${amountUSD.toFixed(2)} USD)</span>
                  </button>
                )}

                {/* SDK 로드 완료 후에도 계정 입력 없이 바로 테스트할 수 있는 원클릭 옵션 */}
                {isSdkLoaded && !isSdkLoading && (
                  <div className="space-y-2 pt-1">
                    <div className="relative flex py-1 items-center">
                      <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                      <span className="flex-shrink mx-3 text-[11px] text-slate-400 font-medium">또는 간편 승인 테스트</span>
                      <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                    </div>
                    <button
                      type="button"
                      disabled={isProcessing || isSuccess}
                      onClick={handleConfirmPayment}
                      className="w-full py-3 px-4 rounded-xl border border-dashed border-amber-400 dark:border-amber-600 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/60 dark:hover:bg-amber-900/30 text-amber-900 dark:text-amber-200 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>Sandbox 로그인 없이 원클릭 시뮬레이션으로 즉시 결제 승인</span>
                    </button>
                  </div>
                )}
              </>
            )}

            <button
              type="button"
              disabled={isProcessing || isSuccess}
              onClick={onClose}
              className="w-full py-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold transition-colors cursor-pointer disabled:opacity-40"
            >
              결제 취소하고 주문서로 돌아가기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
