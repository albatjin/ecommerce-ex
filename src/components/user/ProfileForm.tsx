'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { updateProfileAction } from '@/app/actions/user.actions';
import { User, Phone, MapPin, Shield, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import type { Gender } from '@/shared/types/database.types';

interface ProfileFormProps {
  initialData: {
    name: string;
    phone?: string | null;
    personalCustomsCode?: string | null;
    gender?: Gender | null;
    birthYear?: number | null;
    defaultAddress?: string | null;
    defaultZipcode?: string | null;
    smsConsent: boolean;
    emailConsent: boolean;
  };
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      name: initialData.name,
      phone: initialData.phone || '',
      personalCustomsCode: initialData.personalCustomsCode || '',
      gender: initialData.gender || ('' as Gender | ''),
      birthYear: initialData.birthYear ? String(initialData.birthYear) : '',
      defaultAddress: initialData.defaultAddress || '',
      defaultZipcode: initialData.defaultZipcode || '',
      smsConsent: initialData.smsConsent,
      emailConsent: initialData.emailConsent,
    },
    onSubmit: async ({ value }) => {
      setSuccessMessage(null);
      setErrorMessage(null);

      const result = await updateProfileAction({
        name: value.name,
        phone: value.phone || null,
        personalCustomsCode: value.personalCustomsCode || null,
        gender: value.gender ? (value.gender as Gender) : null,
        birthYear: value.birthYear ? Number(value.birthYear) : null,
        defaultAddress: value.defaultAddress || null,
        defaultZipcode: value.defaultZipcode || null,
        smsConsent: value.smsConsent,
        emailConsent: value.emailConsent,
      });

      if (!result.success && result.error) {
        setErrorMessage(result.error);
      } else {
        setSuccessMessage('회원 정보가 성공적으로 수정되었습니다.');
      }
    },
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
        <User className="w-5 h-5 text-blue-600" />
        기본 회원정보 수정
      </h2>

      {successMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 이름 */}
          <form.Field
            name="name"
            children={(field) => (
              <div className="space-y-1">
                <label htmlFor={field.name} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  id={field.name}
                  name={field.name}
                  type="text"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            )}
          />

          {/* 연락처 */}
          <form.Field
            name="phone"
            children={(field) => (
              <div className="space-y-1">
                <label htmlFor={field.name} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  휴대폰 번호
                </label>
                <div className="relative">
                  <input
                    id={field.name}
                    name={field.name}
                    type="tel"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="010-1234-5678"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            )}
          />
        </div>

        {/* 개인통관고유부호 */}
        <form.Field
          name="personalCustomsCode"
          children={(field) => (
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label htmlFor={field.name} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  개인통관고유부호 (해외직구 상품 주문 시 필요)
                </label>
                <span className="text-[11px] text-slate-400">P로 시작하는 13자리</span>
              </div>
              <div className="relative">
                <input
                  id={field.name}
                  name={field.name}
                  type="text"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value.toUpperCase())}
                  placeholder="P123456789012"
                  maxLength={13}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none uppercase"
                />
                <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}
        />

        {/* 기본 배송지 주소 */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            기본 배송지
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <form.Field
              name="defaultZipcode"
              children={(field) => (
                <input
                  name={field.name}
                  type="text"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="우편번호 (예: 06164)"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                />
              )}
            />
            <div className="sm:col-span-2">
              <form.Field
                name="defaultAddress"
                children={(field) => (
                  <div className="relative">
                    <input
                      name={field.name}
                      type="text"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="기본 주소 및 상세 주소"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                    />
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                )}
              />
            </div>
          </div>
        </div>

        {/* 마케팅 수신동의 */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            혜택 및 이벤트 알림 수신 동의
          </div>
          <div className="flex items-center gap-6 text-xs text-slate-600 dark:text-slate-400">
            <form.Field
              name="smsConsent"
              children={(field) => (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.state.value}
                    onChange={(e) => field.handleChange(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300"
                  />
                  <span>SMS 수신 동의</span>
                </label>
              )}
            />
            <form.Field
              name="emailConsent"
              children={(field) => (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.state.value}
                    onChange={(e) => field.handleChange(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300"
                  />
                  <span>이메일 수신 동의</span>
                </label>
              )}
            />
          </div>
        </div>

        {/* 제출 버튼 */}
        <form.Subscribe
          selector={(state) => [state.isSubmitting]}
          children={([isSubmitting]) => (
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>저장 중...</span>
                </>
              ) : (
                <span>회원 정보 저장</span>
              )}
            </button>
          )}
        />
      </form>
    </div>
  );
}

