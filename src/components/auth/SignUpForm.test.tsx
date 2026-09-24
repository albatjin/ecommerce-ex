import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SignUpForm } from './SignUpForm';

describe('SignUpForm Component', () => {
  it('회원가입 필수 필드들과 웰컴 혜택 뱃지가 렌더링된다', () => {
    render(<SignUpForm />);

    expect(screen.getByRole('heading', { name: '간편 회원가입' })).toBeInTheDocument();
    expect(screen.getByText(/신규 가입 웰컴 적립금 3,000P/)).toBeInTheDocument();
    expect(screen.getByLabelText(/이메일 주소/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^이름/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^비밀번호 \*/)).toBeInTheDocument();
    expect(screen.getByLabelText(/비밀번호 확인/)).toBeInTheDocument();
    expect(screen.getByLabelText(/휴대폰 번호/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '회원가입 완료' })).toBeInTheDocument();
  });

  it('필수 이용약관 동의 및 선택 마케팅 수신동의 체크박스가 존재한다', () => {
    render(<SignUpForm />);

    expect(screen.getByLabelText(/이용약관/)).toBeInTheDocument();
    expect(screen.getByLabelText(/SMS 수신 동의/)).toBeInTheDocument();
    expect(screen.getByLabelText(/이메일 수신 동의/)).toBeInTheDocument();
  });
});

