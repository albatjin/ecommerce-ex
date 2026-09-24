import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminInquiriesViewer } from './AdminInquiriesViewer';
import type { InquiryDTO } from '@/core/application/cs/use-cases/CreateInquiryUseCase';

const mockAnswerInquiryAction = vi.fn();

vi.mock('@/app/actions/inquiry.actions', () => ({
  answerInquiryAction: (...args: any[]) => mockAnswerInquiryAction(...args),
}));

describe('AdminInquiriesViewer Component', () => {
  const sampleInquiries: InquiryDTO[] = [
    {
      id: 'inq-1',
      customerId: 'user-1',
      customerName: '홍길동',
      customerEmail: 'user1@example.com',
      orderId: 'ORD-20260924-00001',
      category: 'ORDER',
      categoryLabel: '주문/결제',
      title: '결제 수단 변경 문의드립니다.',
      content: '신용카드로 결제했는데 카카오페이로 변경할 수 있나요?',
      status: 'ANSWERED',
      statusLabel: '답변 완료',
      answer: '주문 완료 후에는 결제 수단 변경이 불가하여 취소 후 재주문해 주셔야 합니다.',
      answeredAt: '2026-09-24T14:00:00.000Z',
      createdAt: '2026-09-24T12:00:00.000Z',
    },
    {
      id: 'inq-2',
      customerId: 'user-2',
      customerName: '김철수',
      customerEmail: 'user2@example.com',
      orderId: null,
      category: 'PRODUCT',
      categoryLabel: '상품 문의',
      title: '재입고 일정 문의',
      content: '블랙 XL 사이즈 재입고 예정일이 언제인가요?',
      status: 'PENDING',
      statusLabel: '답변 대기',
      answer: null,
      answeredAt: null,
      createdAt: '2026-09-24T15:00:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('관리 콘솔 헤더와 통계(답변 대기 1건, 전체 2건) 및 문의 목록을 올바르게 렌더링한다', () => {
    render(<AdminInquiriesViewer initialInquiries={sampleInquiries} />);
    expect(screen.getByText('1:1 고객 문의 관리 콘솔')).toBeDefined();
    expect(screen.getByText('1건')).toBeDefined(); // pendingCount
    expect(screen.getByText('2건')).toBeDefined(); // totalCount
    expect(screen.getByText('결제 수단 변경 문의드립니다.')).toBeDefined();
    expect(screen.getByText('재입고 일정 문의')).toBeDefined();
  });

  it('상태 탭 필터링(답변 대기 클릭 시 대기 건만 표시)이 작동한다', () => {
    render(<AdminInquiriesViewer initialInquiries={sampleInquiries} />);

    fireEvent.click(screen.getByRole('button', { name: /답변 대기/i }));

    expect(screen.getByText('재입고 일정 문의')).toBeDefined();
    expect(screen.queryByText('결제 수단 변경 문의드립니다.')).toBeNull();
  });

  it('검색어로 문의를 필터링할 수 있다', () => {
    render(<AdminInquiriesViewer initialInquiries={sampleInquiries} />);

    const searchInput = screen.getByPlaceholderText('제목, 내용, 주문번호 검색');
    fireEvent.change(searchInput, { target: { value: '블랙 XL' } });

    expect(screen.getByText('재입고 일정 문의')).toBeDefined();
    expect(screen.queryByText('결제 수단 변경 문의드립니다.')).toBeNull();
  });

  it('답변 작성하기 버튼을 클릭해 모달을 열고 공식 답변을 등록할 수 있다', async () => {
    const updatedInquiry: InquiryDTO = {
      ...sampleInquiries[1],
      status: 'ANSWERED',
      statusLabel: '답변 완료',
      answer: '해당 상품은 다음 주 화요일에 재입고될 예정입니다.',
      answeredAt: new Date().toISOString(),
    };

    mockAnswerInquiryAction.mockResolvedValueOnce({
      success: true,
      data: updatedInquiry,
    });

    render(<AdminInquiriesViewer initialInquiries={sampleInquiries} />);

    // 답변 대기 건의 답변 작성하기 버튼 클릭
    fireEvent.click(screen.getByRole('button', { name: /답변 작성하기/i }));

    expect(screen.getByText('1:1 문의 답변 등록')).toBeDefined();

    // 답변 입력
    const textarea = screen.getByPlaceholderText(/고객님께 전달될 정중하고 명확한 답변을/i);
    fireEvent.change(textarea, {
      target: { value: '해당 상품은 다음 주 화요일에 재입고될 예정입니다.' },
    });

    // 등록 버튼 클릭
    fireEvent.click(screen.getByRole('button', { name: /답변 등록 완료/i }));

    await waitFor(() => {
      expect(mockAnswerInquiryAction).toHaveBeenCalledWith({
        inquiryId: 'inq-2',
        answerText: '해당 상품은 다음 주 화요일에 재입고될 예정입니다.',
      });
      expect(screen.getByText(/공식 답변이 등록되었습니다/i)).toBeDefined();
      expect(screen.getByText('해당 상품은 다음 주 화요일에 재입고될 예정입니다.')).toBeDefined();
    });
  });
});
