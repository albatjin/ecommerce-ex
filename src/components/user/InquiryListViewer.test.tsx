import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InquiryListViewer } from './InquiryListViewer';
import type { InquiryDTO } from '@/core/application/cs/use-cases/CreateInquiryUseCase';

const mockCreateInquiryAction = vi.fn();
const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

vi.mock('@/app/actions/inquiry.actions', () => ({
  createInquiryAction: (...args: any[]) => mockCreateInquiryAction(...args),
}));

describe('InquiryListViewer Component', () => {
  const sampleInquiries: InquiryDTO[] = [
    {
      id: 'inq-1',
      customerId: 'user-1',
      customerName: '홍길동',
      customerEmail: 'test@example.com',
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
      customerId: 'user-1',
      customerName: '홍길동',
      customerEmail: 'test@example.com',
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

  it('문의 목록이 비어있을 때 빈 상태 메시지를 렌더링한다', () => {
    render(<InquiryListViewer initialInquiries={[]} />);
    expect(screen.getByText('등록된 1:1 문의 내역이 없습니다.')).toBeDefined();
  });

  it('문의 목록의 제목, 카테고리, 상태 뱃지를 올바르게 렌더링한다', () => {
    render(<InquiryListViewer initialInquiries={sampleInquiries} />);
    expect(screen.getByText('결제 수단 변경 문의드립니다.')).toBeDefined();
    expect(screen.getByText('재입고 일정 문의')).toBeDefined();
    expect(screen.getByText('답변 완료')).toBeDefined();
    expect(screen.getByText('답변 대기')).toBeDefined();
  });

  it('문의 항목을 클릭하면 질문 내용 및 등록된 답변이 펼쳐진다', () => {
    render(<InquiryListViewer initialInquiries={sampleInquiries} />);
    
    // 처음에는 본문이 보이지 않음
    expect(screen.queryByText('신용카드로 결제했는데 카카오페이로 변경할 수 있나요?')).toBeNull();

    // 헤더 클릭
    fireEvent.click(screen.getByText('결제 수단 변경 문의드립니다.'));

    // 질문 및 답변 내용 표시 확인
    expect(screen.getByText('신용카드로 결제했는데 카카오페이로 변경할 수 있나요?')).toBeDefined();
    expect(screen.getByText('주문 완료 후에는 결제 수단 변경이 불가하여 취소 후 재주문해 주셔야 합니다.')).toBeDefined();
  });

  it('1:1 문의 작성하기 모달을 열고 신규 문의를 제출할 수 있다', async () => {
    const newInquiry: InquiryDTO = {
      id: 'inq-3',
      customerId: 'user-1',
      customerName: '홍길동',
      customerEmail: 'test@example.com',
      orderId: null,
      category: 'SHIPPING',
      categoryLabel: '배송 문의',
      title: '배송지 주소 변경 요청',
      content: '배송지를 다른 주소로 변경하고 싶습니다.',
      status: 'PENDING',
      statusLabel: '답변 대기',
      answer: null,
      answeredAt: null,
      createdAt: new Date().toISOString(),
    };

    mockCreateInquiryAction.mockResolvedValueOnce({
      success: true,
      data: newInquiry,
    });

    render(<InquiryListViewer initialInquiries={sampleInquiries} />);

    // 모달 열기
    fireEvent.click(screen.getByRole('button', { name: /1:1 문의 작성하기/i }));
    expect(screen.getByText('1:1 문의 작성')).toBeDefined();

    // 입력 필드 채우기
    fireEvent.change(screen.getByPlaceholderText('문의 제목을 입력해 주세요'), {
      target: { value: '배송지 주소 변경 요청' },
    });
    fireEvent.change(screen.getByPlaceholderText(/궁금하신 내용을 구체적으로 적어주시면/i), {
      target: { value: '배송지를 다른 주소로 변경하고 싶습니다.' },
    });

    // 제출
    fireEvent.click(screen.getByRole('button', { name: /문의 등록하기/i }));

    await waitFor(() => {
      expect(mockCreateInquiryAction).toHaveBeenCalledWith({
        category: 'ORDER',
        title: '배송지 주소 변경 요청',
        content: '배송지를 다른 주소로 변경하고 싶습니다.',
        orderId: null,
      });
      expect(screen.getByText(/1:1 문의가 성공적으로 등록되었습니다/i)).toBeDefined();
      expect(screen.getByText('배송지 주소 변경 요청')).toBeDefined();
    });
  });
});
