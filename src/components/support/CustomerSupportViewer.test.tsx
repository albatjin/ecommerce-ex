import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CustomerSupportViewer } from './CustomerSupportViewer';

describe('CustomerSupportViewer', () => {
  it('고객센터 메인 타이틀과 4대 빠른 서비스 카드를 정상 렌더링한다', () => {
    render(<CustomerSupportViewer />);

    expect(screen.getByText('무엇을 도와드릴까요?')).toBeInTheDocument();
    expect(screen.getByText('1:1 문의 접수')).toBeInTheDocument();
    expect(screen.getByText('주문 / 배송 조회')).toBeInTheDocument();
    expect(screen.getByText('취소 / 반품 / 교환')).toBeInTheDocument();
    expect(screen.getByText('회원정보 & 등급 혜택')).toBeInTheDocument();
  });

  it('상담 전화번호와 운영시간 안내를 렌더링한다', () => {
    render(<CustomerSupportViewer />);

    expect(screen.getByText('1588-4920')).toBeInTheDocument();
    expect(screen.getByText(/평일 09:30 ~ 18:00/)).toBeInTheDocument();
    expect(screen.getByText('support@commercehub.co.kr')).toBeInTheDocument();
  });

  it('FAQ 질문을 클릭하면 답변 아코디언이 토글된다', () => {
    render(<CustomerSupportViewer />);

    // faq-1은 초기 펼침 상태
    expect(screen.getByText(/평일 오후 2시 이전 결제 완료 건은 당일 출고/)).toBeInTheDocument();

    // 두 번째 FAQ 클릭
    const faq2Question = screen.getByText('배송비 정책과 무료 배송 기준이 궁금합니다.');
    fireEvent.click(faq2Question);

    expect(screen.getByText(/기본 배송비는 3,000원이며, 50,000원 이상 구매 시 전 상품 무료 배송/)).toBeInTheDocument();
  });

  it('검색어를 입력하면 관련 질문만 필터링된다', () => {
    render(<CustomerSupportViewer />);

    const searchInput = screen.getByPlaceholderText(/궁금한 질문 키워드를 검색해보세요/);
    fireEvent.change(searchInput, { target: { value: '환불' } });

    expect(screen.getByText('주문 취소 시 환불은 언제 입금되나요?')).toBeInTheDocument();
    expect(screen.queryByText('배송은 보통 얼마나 걸리나요?')).not.toBeInTheDocument();
  });
});

