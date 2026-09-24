'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, CreditCard, CheckCircle2, Check } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

export type CheckoutStep = 'cart' | 'checkout' | 'success';

export interface CheckoutStepIndicatorProps {
  currentStep: CheckoutStep;
  className?: string;
}

interface StepConfig {
  id: CheckoutStep;
  stepNumber: number;
  label: string;
  subLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
}

const STEPS: StepConfig[] = [
  {
    id: 'cart',
    stepNumber: 1,
    label: '장바구니',
    subLabel: 'Cart',
    icon: ShoppingBag,
    href: '/cart',
  },
  {
    id: 'checkout',
    stepNumber: 2,
    label: '주문 / 결제',
    subLabel: 'Order & Pay',
    icon: CreditCard,
    href: '/checkout',
  },
  {
    id: 'success',
    stepNumber: 3,
    label: '주문 완료',
    subLabel: 'Complete',
    icon: CheckCircle2,
  },
];

const STEP_ORDER: Record<CheckoutStep, number> = {
  cart: 1,
  checkout: 2,
  success: 3,
};

export function CheckoutStepIndicator({
  currentStep,
  className,
}: CheckoutStepIndicatorProps) {
  const currentStepNum = STEP_ORDER[currentStep];

  return (
    <nav
      aria-label="주문 진행 단계"
      className={cn(
        'w-full max-w-2xl mx-auto mb-8 sm:mb-12 py-3 px-4 sm:px-6 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200/70 dark:border-slate-800 shadow-xs',
        className
      )}
    >
      <ol className="flex items-center justify-between w-full relative">
        {STEPS.map((step, index) => {
          const isDone = currentStepNum > step.stepNumber;
          const isCurrent = currentStepNum === step.stepNumber;
          const isUpcoming = currentStepNum < step.stepNumber;
          const Icon = step.icon;

          const content = (
            <div
              className={cn(
                'flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3 transition-colors',
                isCurrent && 'text-blue-600 dark:text-blue-400 font-extrabold',
                isDone && 'text-slate-800 dark:text-slate-200 font-semibold',
                isUpcoming && 'text-slate-400 dark:text-slate-600 font-medium'
              )}
            >
              {/* Step Circle Badge */}
              <div
                className={cn(
                  'w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all shrink-0',
                  isCurrent &&
                    'bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-4 ring-blue-100 dark:ring-blue-950/60',
                  isDone &&
                    'bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
                  isUpcoming &&
                    'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200/80 dark:border-slate-700'
                )}
              >
                {isDone ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : (
                  <span>0{step.stepNumber}</span>
                )}
              </div>

              {/* Step Labels */}
              <div className="text-center sm:text-left">
                <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                  <Icon
                    className={cn(
                      'hidden sm:block w-3.5 h-3.5',
                      isCurrent && 'text-blue-600 dark:text-blue-400',
                      isDone && 'text-slate-600 dark:text-slate-300',
                      isUpcoming && 'text-slate-400 dark:text-slate-600'
                    )}
                  />
                  <span className="text-xs sm:text-sm tracking-tight whitespace-nowrap">
                    {step.label}
                  </span>
                </div>
                <span
                  className={cn(
                    'hidden sm:block text-[10px] uppercase font-bold tracking-wider',
                    isCurrent
                      ? 'text-blue-500/80 dark:text-blue-400/80'
                      : 'text-slate-400 dark:text-slate-500'
                  )}
                >
                  {step.subLabel}
                </span>
              </div>
            </div>
          );

          return (
            <li
              key={step.id}
              className="flex-1 flex items-center relative"
              aria-current={isCurrent ? 'step' : undefined}
            >
              <div className="flex items-center justify-center w-full z-10">
                {isDone && step.href ? (
                  <Link
                    href={step.href}
                    className="hover:opacity-80 transition-opacity"
                    title={`${step.label} 단계로 이동`}
                  >
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </div>

              {/* Connecting Line Between Steps */}
              {index < STEPS.length - 1 && (
                <div
                  className="absolute left-1/2 top-4 sm:top-4.5 w-full h-[2px] -translate-y-1/2 -z-0 pointer-events-none"
                  aria-hidden="true"
                >
                  <div
                    className={cn(
                      'h-full mx-6 transition-all duration-500',
                      currentStepNum > step.stepNumber
                        ? 'bg-blue-500 dark:bg-blue-600'
                        : 'bg-slate-200 dark:bg-slate-800'
                    )}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

