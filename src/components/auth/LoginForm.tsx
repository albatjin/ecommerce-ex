'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { signInAction } from '@/app/actions/auth.actions';
import { loginSchema } from '@/core/application/auth/validators/auth.schema';
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface LoginFormProps {
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

export function LoginForm({ redirectTo = '/' }: LoginFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    validators: {
      onChange: loginSchema,
    },
    onSubmit: async ({ value }) => {
      setServerError(null);
      try {
        const result = await signInAction(value, redirectTo);
        if (result && !result.success && result.error) {
          setServerError(result.error);
        }
      } catch (err: unknown) {
        // Next.js redirect() throws an error internally to perform navigation
        if (err && typeof err === 'object' && 'digest' in err) {
          throw err;
        }
        setServerError('로그인 중 예기치 않은 오류가 발생했습니다.');
      }
    },
  });

  return (
    <div className="w-full max-w-md p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          로그인
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
          CommerceHub 계정으로 편리한 쇼핑을 시작하세요
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
        {/* 이메일 필드 */}
        <form.Field
          name="email"
          children={(field) => {
            const errorMsg = getErrorMessage(field.state.meta.errors[0]);
            return (
              <div className="space-y-1">
                <label
                  htmlFor={field.name}
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  이메일 주소
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
                      errorMsg
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-slate-200 dark:border-slate-700 focus:border-blue-500'
                    }`}
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                {errorMsg && (
                  <p className="text-[11px] text-red-500 font-medium">
                    {errorMsg}
                  </p>
                )}
              </div>
            );
          }}
        />

        {/* 비밀번호 필드 */}
        <form.Field
          name="password"
          children={(field) => {
            const errorMsg = getErrorMessage(field.state.meta.errors[0]);
            return (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label
                    htmlFor={field.name}
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    비밀번호
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-[11px] text-blue-600 hover:underline"
                  >
                    비밀번호 찾기
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id={field.name}
                    name={field.name}
                    type="password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-3 py-2 text-sm rounded-xl border bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-colors ${
                      errorMsg
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-slate-200 dark:border-slate-700 focus:border-blue-500'
                    }`}
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                {errorMsg && (
                  <p className="text-[11px] text-red-500 font-medium">
                    {errorMsg}
                  </p>
                )}
              </div>
            );
          }}
        />

        {/* 제출 버튼 */}
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>로그인 중...</span>
                </>
              ) : (
                <span>로그인하기</span>
              )}
            </button>
          )}
        />
      </form>

      {/* 하단 링크 */}
      <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500">
        아직 회원이 아니신가요?{' '}
        <Link
          href={`/signup${redirectTo !== '/' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
          className="text-blue-600 font-semibold hover:underline"
        >
          간편 회원가입
        </Link>
      </div>
    </div>
  );
}

