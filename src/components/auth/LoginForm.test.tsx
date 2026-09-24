import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LoginForm } from './LoginForm';

describe('LoginForm Component', () => {
  it('이메일, 비밀번호 필드 및 로그인 버튼이 올바르게 렌더링된다', () => {
    render(<LoginForm />);

    expect(screen.getByRole('heading', { name: '로그인' })).toBeInTheDocument();
    expect(screen.getByLabelText('이메일 주소')).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '로그인하기' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '간편 회원가입' })).toBeInTheDocument();
  });

  it('비밀번호 찾기 링크가 존재한다', () => {
    render(<LoginForm />);
    expect(screen.getByRole('link', { name: '비밀번호 찾기' })).toBeInTheDocument();
  });
});

