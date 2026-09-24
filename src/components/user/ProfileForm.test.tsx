import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ProfileForm } from './ProfileForm';

describe('ProfileForm Component', () => {
  const initialData = {
    name: '홍길동',
    phone: '010-1234-5678',
    personalCustomsCode: 'P123456789012',
    gender: 'MALE' as const,
    birthYear: 1990,
    defaultAddress: '서울시 강남구 테헤란로 427',
    defaultZipcode: '06164',
    smsConsent: true,
    emailConsent: false,
  };

  it('기존 회원 정보가 폼 인풋 필드에 올바르게 채워져 렌더링된다', () => {
    render(<ProfileForm initialData={initialData} />);

    expect(screen.getByRole('heading', { name: '기본 회원정보 수정' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('홍길동')).toBeInTheDocument();
    expect(screen.getByDisplayValue('010-1234-5678')).toBeInTheDocument();
    expect(screen.getByDisplayValue('P123456789012')).toBeInTheDocument();
    expect(screen.getByDisplayValue('서울시 강남구 테헤란로 427')).toBeInTheDocument();
    expect(screen.getByDisplayValue('06164')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '회원 정보 저장' })).toBeInTheDocument();
  });
});

