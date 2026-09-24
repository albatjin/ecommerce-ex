import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Footer } from './Footer';

describe('Footer Component', () => {
  it('쇼핑몰 상호명과 사업자 정보가 정상적으로 노출된다', () => {
    render(<Footer />);
    expect(screen.getByText('CommerceHub 공식스토어')).toBeInTheDocument();
    expect(screen.getByText(/214-88-91204/)).toBeInTheDocument();
    expect(screen.getByText(/대표자: 김은영/)).toBeInTheDocument();
  });

  it('고객행복센터 전화번호 및 이메일이 노출된다', () => {
    render(<Footer />);
    expect(screen.getByText('1588-4920')).toBeInTheDocument();
    expect(screen.getByText('support@commercehub.co.kr')).toBeInTheDocument();
  });

  it('이용약관 및 개인정보처리방침 링크가 존재한다', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: '이용약관' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '개인정보처리방침' })).toBeInTheDocument();
  });
});

