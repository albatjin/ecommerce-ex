'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  X,
  CreditCard,
  Lock,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
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
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // 기준 환율 1 USD = 1,400 KRW
  const EXCHANGE_RATE = 1400;
  const amountUSD = Number((amountKRW / EXCHANGE_RATE).toFixed(2));

  const handleConfirmPayment = async () => {
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
        payerName: recipientName || 'Verified PayPal Customer',
        usdAmount: amountUSD,
        exchangeRate: EXCHANGE_RATE,
        approvedAt: new Date().toISOString(),
      });
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
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
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
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

          {/* 가상 PayPal 계정 및 결제 수단 */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              PayPal 결제 계정
            </span>
            <div className="p-3.5 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                      PayPal 잔액 & Visa •••• 4021
                    </span>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.5 rounded">
                      기본 결제
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    customer@paypal-sandbox.com
                  </span>
                </div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
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

          {/* 3. 승인 및 취소 버튼 */}
          <div className="pt-2 space-y-2">
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleConfirmPayment}
              className="w-full py-4 px-6 rounded-2xl bg-[#FFC439] hover:bg-[#F2BA36] text-[#003087] font-black text-base shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <span className="w-5 h-5 border-2 border-[#003087]/30 border-t-[#003087] rounded-full animate-spin" />
                  <span>PayPal 승인 처리 중...</span>
                </>
              ) : (
                <>
                  <span className="font-extrabold text-[#003087]">Pay with</span>
                  <span className="font-black italic text-[#003087] tracking-tight">PayPal</span>
                  <span>(${amountUSD.toFixed(2)} USD)</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={onClose}
              className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold transition-colors cursor-pointer"
            >
              결제 취소하고 주문서로 돌아가기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

