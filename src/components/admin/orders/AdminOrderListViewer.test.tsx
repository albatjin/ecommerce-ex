import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminOrderListViewer } from './AdminOrderListViewer';
import type { OrderListItemDTO } from '@/core/application/order/dtos/OrderDTO';

const mockUpdateDeliveryAction = vi.fn();

vi.mock('@/app/actions/order.actions', () => ({
  updateOrderDeliveryAction: (...args: unknown[]) => mockUpdateDeliveryAction(...args),
}));

const mockOrders: OrderListItemDTO[] = [
  {
    id: 'order-1',
    orderNumber: 'ORD-20260925-00001',
    orderName: '프리미엄 무선 헤드폰 1개',
    status: 'PAID',
    statusLabel: '결제 완료',
    itemCount: 1,
    firstItemImageUrl: 'https://example.com/headphone.jpg',
    totalPaidAmount: 150000,
    paymentMethodLabel: '신용/체크카드',
    createdAt: '2026-09-25T01:00:00Z',
    recipientName: '홍길동',
    recipientPhone: '010-1234-5678',
    shippingAddress: '서울시 강남구 테헤란로 123',
    trackingCompany: null,
    trackingNumber: null,
  },
  {
    id: 'order-2',
    orderNumber: 'ORD-20260925-00002',
    orderName: '스마트 피트니스 워치 1개',
    status: 'PREPARING',
    statusLabel: '배송 준비 중',
    itemCount: 1,
    firstItemImageUrl: null,
    totalPaidAmount: 300000,
    paymentMethodLabel: '네이버페이',
    createdAt: '2026-09-25T02:00:00Z',
    recipientName: '이영희',
    recipientPhone: '010-9876-5432',
    shippingAddress: '부산시 해운대구 마린시티 456',
    trackingCompany: null,
    trackingNumber: null,
  },
  {
    id: 'order-3',
    orderNumber: 'ORD-20260925-00003',
    orderName: '오가닉 코튼 티셔츠 2개',
    status: 'SHIPPING',
    statusLabel: '배송 중',
    itemCount: 2,
    firstItemImageUrl: null,
    totalPaidAmount: 64000,
    paymentMethodLabel: '카카오페이',
    createdAt: '2026-09-25T03:00:00Z',
    recipientName: '박철수',
    recipientPhone: '010-5555-6666',
    shippingAddress: '대전시 유성구 대학로 789',
    trackingCompany: 'CJ대한통운',
    trackingNumber: '68392019482',
    shippedAt: '2026-09-25T04:00:00Z',
  },
  {
    id: 'order-4',
    orderNumber: 'ORD-20260925-00004',
    orderName: '캐시미어 니트 1개',
    status: 'DELIVERED',
    statusLabel: '배송 완료',
    itemCount: 1,
    firstItemImageUrl: null,
    totalPaidAmount: 99000,
    paymentMethodLabel: '신용/체크카드',
    createdAt: '2026-09-24T00:00:00Z',
    recipientName: '김민수',
    recipientPhone: '010-7777-8888',
    shippingAddress: '인천시 남동구 구월로 101',
    trackingCompany: '우체국택배',
    trackingNumber: '1122334455',
    shippedAt: '2026-09-24T05:00:00Z',
    deliveredAt: '2026-09-25T00:00:00Z',
  },
];

describe('AdminOrderListViewer Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('주문 목록과 상태 통계 카드를 정상적으로 렌더링한다', () => {
    render(<AdminOrderListViewer initialOrders={mockOrders} totalCount={4} />);

    expect(screen.getByText('주문 & 배송 통합 관리 (CMS)')).toBeInTheDocument();
    expect(screen.getByText('ORD-20260925-00001')).toBeInTheDocument();
    expect(screen.getByText('ORD-20260925-00002')).toBeInTheDocument();
    expect(screen.getByText('ORD-20260925-00003')).toBeInTheDocument();
    expect(screen.getByText('ORD-20260925-00004')).toBeInTheDocument();
  });

  it('검색어로 주문번호 또는 수령인 검색 시 일치하는 주문만 필터링된다', () => {
    render(<AdminOrderListViewer initialOrders={mockOrders} totalCount={4} />);

    const searchInput = screen.getByPlaceholderText(/검색/i);
    fireEvent.change(searchInput, { target: { value: '이영희' } });

    expect(screen.getByText('ORD-20260925-00002')).toBeInTheDocument();
    expect(screen.queryByText('ORD-20260925-00001')).not.toBeInTheDocument();
    expect(screen.queryByText('ORD-20260925-00003')).not.toBeInTheDocument();
  });

  it('상태 탭(배송 중)을 클릭하면 배송 중 주문만 표시된다', () => {
    render(<AdminOrderListViewer initialOrders={mockOrders} totalCount={4} />);

    const shippingTab = screen.getByRole('button', { name: /배송 중 \(1\)/i });
    fireEvent.click(shippingTab);

    expect(screen.getByText('ORD-20260925-00003')).toBeInTheDocument();
    expect(screen.queryByText('ORD-20260925-00001')).not.toBeInTheDocument();
    expect(screen.queryByText('ORD-20260925-00002')).not.toBeInTheDocument();
  });

  it('결제완료(PAID) 주문에서 [배송준비] 버튼 클릭 시 updateOrderDeliveryAction이 호출된다', async () => {
    mockUpdateDeliveryAction.mockResolvedValueOnce({
      success: true,
      data: {
        orderId: 'order-1',
        orderNumber: 'ORD-20260925-00001',
        status: 'PREPARING',
        statusLabel: '배송 준비 중',
      },
    });

    render(<AdminOrderListViewer initialOrders={mockOrders} totalCount={4} />);

    const prepareBtn = screen.getByRole('button', { name: '주문 ORD-20260925-00001 배송준비' });
    fireEvent.click(prepareBtn);

    await waitFor(() => {
      expect(mockUpdateDeliveryAction).toHaveBeenCalledWith({
        orderId: 'order-1',
        targetStatus: 'PREPARING',
      });
    });
  });

  it('배송준비(PREPARING) 주문에서 [송장등록 & 배송시작] 클릭 시 모달이 열리고 등록 처리가 된다', async () => {
    mockUpdateDeliveryAction.mockResolvedValueOnce({
      success: true,
      data: {
        orderId: 'order-2',
        orderNumber: 'ORD-20260925-00002',
        status: 'SHIPPING',
        statusLabel: '배송 중',
        trackingCompany: 'CJ대한통운',
        trackingNumber: '1234567890',
      },
    });

    render(<AdminOrderListViewer initialOrders={mockOrders} totalCount={4} />);

    const openModalBtn = screen.getByRole('button', { name: '주문 ORD-20260925-00002 송장등록 & 배송시작' });
    fireEvent.click(openModalBtn);

    // 모달 렌더링 확인
    expect(screen.getByText('배송 시작 & 운송장 번호 등록')).toBeInTheDocument();

    // 송장 번호 입력
    const trackingInput = screen.getByPlaceholderText(/하이픈\(-\) 없이 숫자만/i);
    fireEvent.change(trackingInput, { target: { value: '1234567890' } });

    // 제출
    const submitBtn = screen.getByRole('button', { name: '배송 시작 및 송장 등록' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockUpdateDeliveryAction).toHaveBeenCalledWith({
        orderId: 'order-2',
        targetStatus: 'SHIPPING',
        trackingCompany: 'CJ대한통운',
        trackingNumber: '1234567890',
      });
    });
  });

  it('배송중(SHIPPING) 주문에서 [배송 완료] 클릭 시 확인 후 updateOrderDeliveryAction이 호출된다', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockUpdateDeliveryAction.mockResolvedValueOnce({
      success: true,
      data: {
        orderId: 'order-3',
        orderNumber: 'ORD-20260925-00003',
        status: 'DELIVERED',
        statusLabel: '배송 완료',
      },
    });

    render(<AdminOrderListViewer initialOrders={mockOrders} totalCount={4} />);

    const deliveredBtn = screen.getByRole('button', { name: '주문 ORD-20260925-00003 배송 완료' });
    fireEvent.click(deliveredBtn);

    await waitFor(() => {
      expect(mockUpdateDeliveryAction).toHaveBeenCalledWith({
        orderId: 'order-3',
        targetStatus: 'DELIVERED',
      });
    });
  });
});
