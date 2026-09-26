'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { signUpAction } from '@/app/actions/auth.actions';
import { signUpSchema } from '@/core/application/auth/validators/auth.schema';
import { Mail, Lock, User as UserIcon, Phone, AlertCircle, CheckCircle, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface SignUpFormProps {
  redirectTo?: string;
}

function getErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (typeof error === 'string') return error;
  if (typeof error === 'object' && 'message' in error && typeof (error as { message: unknown }).message === 'string') {
    return (error as { message: string }).message;
  }
  return String(error);
}

export function SignUpForm({ redirectTo = '/' }: SignUpFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      phone: '',
      termsConsent: false,
      smsConsent: false,
      emailConsent: false,
    },
    validators: {
      onChange: signUpSchema,
    },
    onSubmit: async ({ value }) => {
      setServerError(null);
      const result = await signUpAction({
        email: value.email,
        password: value.password,
        name: value.name,
        phone: value.phone || null,
        smsConsent: value.smsConsent,
        emailConsent: value.emailConsent,
      });

      if (!result.success && result.error) {
        setServerError(result.error);
      } else {
        setIsSuccess(true);
      }
    },
  });

  if (isSuccess) {
    return (
      <div className="w-full max-w-md p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          회원가입 완료!
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          aramdream store의 회원이 되신 것을 진심으로 환영합니다.<br />
          신규 가입 혜택으로 <span className="text-blue-600 font-bold">3,000원 적립금</span>이 지급되었습니다.
        </p>
        <Link
          href={`/login${redirectTo !== '/' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
          className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm inline-flex items-center justify-center shadow-sm transition-all"
        >
          로그인하고 쇼핑 시작하기
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>신규 가입 웰컴 적립금 3,000P 즉시 지급</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          간편 회원가입
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
          기본 정보를 입력하고 다양한 프리미엄 혜택을 누리세요
        </p>
      </div>

      {serverError && (
        <div
          role="alert"
          className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs sm:text-sm flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        {/* 이메일 */}
        <form.Field
          name="email"
          children={(field) => {
            const errorMsg = getErrorMessage(field.state.meta.errors[0]);
            return (
              <div className="space-y-1">
                <label htmlFor={field.name} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  이메일 주소 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id={field.name}
                    name={field.name}
                    type="email"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="name@example.com"
                    className={`w-full pl-10 pr-3 py-2 text-sm rounded-xl border bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-colors ${
                      errorMsg ? 'border-red-500' : 'border-slate-200 dark:border-slate-700 focus:border-blue-500'
                    }`}
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                {errorMsg && <p className="text-[11px] text-red-500 font-medium">{errorMsg}</p>}
              </div>
            );
          }}
        />

        {/* 이름 */}
        <form.Field
          name="name"
          children={(field) => {
            const errorMsg = getErrorMessage(field.state.meta.errors[0]);
            return (
              <div className="space-y-1">
                <label htmlFor={field.name} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  이름 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id={field.name}
                    name={field.name}
                    type="text"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="홍길동"
                    className={`w-full pl-10 pr-3 py-2 text-sm rounded-xl border bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-colors ${
                      errorMsg ? 'border-red-500' : 'border-slate-200 dark:border-slate-700 focus:border-blue-500'
                    }`}
                  />
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                {errorMsg && <p className="text-[11px] text-red-500 font-medium">{errorMsg}</p>}
              </div>
            );
          }}
        />

        {/* 비밀번호 */}
        <form.Field
          name="password"
          children={(field) => {
            const errorMsg = getErrorMessage(field.state.meta.errors[0]);
            return (
              <div className="space-y-1">
                <label htmlFor={field.name} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  비밀번호 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id={field.name}
                    name={field.name}
                    type="password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="최소 6자 이상"
                    className={`w-full pl-10 pr-3 py-2 text-sm rounded-xl border bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-colors ${
                      errorMsg ? 'border-red-500' : 'border-slate-200 dark:border-slate-700 focus:border-blue-500'
                    }`}
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                {errorMsg && <p className="text-[11px] text-red-500 font-medium">{errorMsg}</p>}
              </div>
            );
          }}
        />

        {/* 비밀번호 확인 */}
        <form.Field
          name="confirmPassword"
          children={(field) => {
            const errorMsg = getErrorMessage(field.state.meta.errors[0]);
            return (
              <div className="space-y-1">
                <label htmlFor={field.name} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  비밀번호 확인 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id={field.name}
                    name={field.name}
                    type="password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="비밀번호 재입력"
                    className={`w-full pl-10 pr-3 py-2 text-sm rounded-xl border bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-colors ${
                      errorMsg ? 'border-red-500' : 'border-slate-200 dark:border-slate-700 focus:border-blue-500'
                    }`}
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                {errorMsg && <p className="text-[11px] text-red-500 font-medium">{errorMsg}</p>}
              </div>
            );
          }}
        />

        {/* 휴대폰 번호 (선택) */}
        <form.Field
          name="phone"
          children={(field) => {
            const errorMsg = getErrorMessage(field.state.meta.errors[0]);
            return (
              <div className="space-y-1">
                <label htmlFor={field.name} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  휴대폰 번호 <span className="text-slate-400 font-normal">(선택)</span>
                </label>
                <div className="relative">
                  <input
                    id={field.name}
                    name={field.name}
                    type="tel"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="010-1234-5678"
                    className={`w-full pl-10 pr-3 py-2 text-sm rounded-xl border bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-colors ${
                      errorMsg ? 'border-red-500' : 'border-slate-200 dark:border-slate-700 focus:border-blue-500'
                    }`}
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                {errorMsg && <p className="text-[11px] text-red-500 font-medium">{errorMsg}</p>}
              </div>
            );
          }}
        />

        {/* 약관 동의 체크박스 영역 */}
        <div className="pt-2 space-y-2.5 border-t border-slate-100 dark:border-slate-800">
          <form.Field
            name="termsConsent"
            children={(field) => {
              const errorMsg = getErrorMessage(field.state.meta.errors[0]);
              return (
                <div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300 font-medium">
                    <input
                      type="checkbox"
                      checked={field.state.value}
                      onChange={(e) => field.handleChange(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <span>
                      [필수] <Link href="/terms" target="_blank" className="underline">이용약관</Link> 및{' '}
                      <Link href="/privacy" target="_blank" className="underline">개인정보 수집·이용</Link> 동의
                    </span>
                  </label>
                  {errorMsg && (
                    <p className="text-[11px] text-red-500 font-medium mt-1">
                      {errorMsg}
                    </p>
                  )}
                </div>
              );
            }}
          />

          <div className="flex items-center gap-6 pl-6 text-xs text-slate-500">
            <form.Field
              name="smsConsent"
              children={(field) => (
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.state.value}
                    onChange={(e) => field.handleChange(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-blue-600 border-slate-300"
                  />
                  <span>[선택] SMS 수신 동의</span>
                </label>
              )}
            />
            <form.Field
              name="emailConsent"
              children={(field) => (
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.state.value}
                    onChange={(e) => field.handleChange(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-blue-600 border-slate-300"
                  />
                  <span>[선택] 이메일 수신 동의</span>
                </label>
              )}
            />
          </div>
        </div>

        {/* 제출 버튼 */}
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className="w-full mt-4 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>가입 처리 중...</span>
                </>
              ) : (
                <span>회원가입 완료</span>
              )}
            </button>
          )}
        />
      </form>

      {/* 하단 로그인 링크 */}
      <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500">
        이미 계정이 있으신가요?{' '}
        <Link
          href={`/login${redirectTo !== '/' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
          className="text-blue-600 font-semibold hover:underline"
        >
          로그인하기
        </Link>
      </div>
    </div>
  );
}

