import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Header } from './Header';

describe('Header Component', () => {
  it('브랜드 로고와 상호명이 올바르게 렌더링된다', () => {
    render(<Header />);
    expect(screen.getByText('Commerce')).toBeInTheDocument();
    expect(screen.getByText('Hub')).toBeInTheDocument();
  });

  it('비로그인 상태일 때는 로그인 버튼을 표시한다', () => {
    render(<Header userName={null} />);
    expect(screen.getByText('로그인')).toBeInTheDocument();
  });

  it('로그인 상태일 때는 사용자 이름과 님을 표시한다', () => {
    render(<Header userName="홍길동" />);
    expect(screen.getByText('홍길동님')).toBeInTheDocument();
  });

  it('장바구니 아이템이 0개일 때는 카운트 배지가 노출되지 않는다', () => {
    render(<Header cartItemCount={0} />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('장바구니 아이템이 있을 때 카운트 숫자를 배지로 표시한다', () => {
    render(<Header cartItemCount={3} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('관리자 권한(isAdmin=true)일 때는 상단에 관리자 콘솔 링크가 노출된다', () => {
    render(<Header isAdmin={true} />);
    expect(screen.getByText('관리자 콘솔')).toBeInTheDocument();
  });

  it('일반 사용자(isAdmin=false)일 때는 관리자 콘솔 링크가 노출되지 않는다', () => {
    render(<Header isAdmin={false} />);
    expect(screen.queryByText('관리자 콘솔')).not.toBeInTheDocument();
  });
});

