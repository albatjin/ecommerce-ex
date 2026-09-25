import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Header } from './Header';

describe('Header Component', () => {
  it('브랜드 로고와 상호명이 올바르게 렌더링된다', () => {
    render(<Header />);
    expect(screen.getByText('Commerce')).toBeInTheDocument();
    expect(screen.getByText('Hub')).toBeInTheDocument();
  });

  it('비로그인 상태일 때는 로그인 및 회원가입 버튼을 표시한다', () => {
    render(<Header userName={null} />);
    expect(screen.getAllByText('로그인').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('회원가입').length).toBeGreaterThanOrEqual(1);
  });

  it('로그인 상태일 때는 사용자 이름과 님, 그리고 로그아웃을 표시한다', () => {
    render(<Header userName="홍길동" />);
    expect(screen.getAllByText(/홍길동/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('로그아웃').length).toBeGreaterThanOrEqual(1);
  });

  it('장바구니 아이템이 0개일 때는 카운트 배지가 노출되지 않는다', () => {
    render(<Header cartItemCount={0} />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('장바구니 아이템이 있을 때 카운트 숫자를 배지로 표시한다', () => {
    render(<Header cartItemCount={3} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('관리자 권한(isAdmin=true)일 때는 상단 및 GNB에 관리자 콘솔 및 대시보드 링크가 노출된다', () => {
    render(<Header isAdmin={true} />);
    expect(screen.getAllByText('관리자 콘솔').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('관리자 대시보드')).toBeInTheDocument();
  });

  it('일반 사용자(isAdmin=false)일 때는 관리자 콘솔 및 대시보드 링크가 노출되지 않는다', () => {
    render(<Header isAdmin={false} />);
    expect(screen.queryByText('관리자 콘솔')).not.toBeInTheDocument();
    expect(screen.queryByText('관리자 대시보드')).not.toBeInTheDocument();
  });

  it('GNB에 전체 카테고리 드롭다운 트리거가 렌더링된다', () => {
    render(<Header />);
    expect(screen.getByRole('button', { name: /전체 카테고리/i })).toBeInTheDocument();
  });

  it('모바일 햄버거 메뉴 버튼 클릭 시 모바일 내비게이션 드로어가 토글된다', () => {
    const { fireEvent } = require('@testing-library/react');
    render(<Header />);

    const mobileMenuBtn = screen.getByRole('button', { name: '모바일 메뉴 열기' });
    expect(screen.queryByText('전체 상품 둘러보기')).not.toBeInTheDocument();

    fireEvent.click(mobileMenuBtn);
    expect(screen.getByText('전체 상품 둘러보기')).toBeInTheDocument();

    fireEvent.click(mobileMenuBtn);
    expect(screen.queryByText('전체 상품 둘러보기')).not.toBeInTheDocument();
  });
});

