import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrderListViewer } from './OrderListViewer';
import type { OrderListItemDTO } from '@/core/application/order/dtos/OrderDTO';

const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

const mockCancelOrderAction = vi.fn();
const mockRequestReturnAction = vi.fn();

vi.mock('@/app/actions/order.actions', () => ({
  cancelOrderAction: (...args: any[]) => mockCancelOrderAction(...args),
  requestReturnAction: (...args: any[]) => mockRequestReturnAction(...args),
}));

describe('OrderListViewer Component', () => {
  const sampleOrders: OrderListItemDTO[] = [
    {
      id: 'order-1',
      orderNumber: 'ORD-20260924-00001',
      orderName: '프리미엄 셔츠 외 1건',
      status: 'PAID',
      statusLabel: '결제 완료',
      itemCount: 2,
      firstItemImageUrl: 'https://example.com/shirt.jpg',
      totalPaidAmount: 85000,
      paymentMethodLabel: '신용/체크카드',
      createdAt: '2026-09-24T10:00:00.000Z',
    },
    {
      id: 'order-2',
      orderNumber: 'ORD-20260924-00002',
      orderName: '가죽 스니커즈',
      status: 'DELIVERED',
      statusLabel: '배송 완료',
      itemCount: 1,
      firstItemImageUrl: 'https://example.com/shoes.jpg',
      totalPaidAmount: 120000,
      paymentMethodLabel: '카카오페이',
      createdAt: '2026-09-23T14:00:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('주문 목록과 상태 뱃지, 주문 금액 및 주문 취소/반품 신청 버튼을 정상적으로 렌더링한다', () => {
    render(<OrderListViewer initialOrders={sampleOrders} totalCount={2} />);

    expect(screen.getByText('주문 / 배송 조회')).toBeInTheDocument();
    expect(screen.getByText('ORD-20260924-00001')).toBeInTheDocument();
    expect(screen.getByText('프리미엄 셔츠 외 1건')).toBeInTheDocument();
    expect(screen.getByText('85,000원')).toBeInTheDocument();
    expect(screen.getByText('가죽 스니커즈')).toBeInTheDocument();
    expect(screen.getByText('120,000원')).toBeInTheDocument();

    // PAID 주문에는 주문 취소 버튼이 있어야 함
    expect(screen.getAllByRole('button', { name: '주문 취소' }).length).toBeGreaterThanOrEqual(1);
    // DELIVERED 주문에는 반품 신청 버튼이 있어야 함
    expect(screen.getAllByRole('button', { name: '반품 신청' }).length).toBeGreaterThanOrEqual(1);
  });

  it('상태 탭을 클릭하면 해당 상태의 주문만 필터링되어 노출된다', () => {
    render(<OrderListViewer initialOrders={sampleOrders} totalCount={2} />);

    // 배송완료 탭 클릭
    const deliveredTab = screen.getByRole('button', { name: '배송완료' });
    fireEvent.click(deliveredTab);

    // 가죽 스니커즈만 표시되고 프리미엄 셔츠는 숨겨짐
    expect(screen.getByText('가죽 스니커즈')).toBeInTheDocument();
    expect(screen.queryByText('프리미엄 셔츠 외 1건')).not.toBeInTheDocument();
  });

  it('주문 목록에서 직접 주문 취소 버튼을 클릭하여 취소 모달을 열고 취소를 진행할 수 있다', async () => {
    mockCancelOrderAction.mockResolvedValue({
      success: true,
      data: {
        orderId: 'order-1',
        orderNumber: 'ORD-20260924-00001',
        refundedAmount: 85000,
      },
    });

    render(<OrderListViewer initialOrders={sampleOrders} totalCount={2} />);

    const cancelButtons = screen.getAllByRole('button', { name: '주문 취소' });
    fireEvent.click(cancelButtons[0]);

    // 모달 타이틀 확인
    expect(screen.getByText('주문 취소 신청')).toBeInTheDocument();

    // 취소 확정
    const confirmBtn = screen.getByRole('button', { name: '주문 취소 확정' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockCancelOrderAction).toHaveBeenCalledWith({
        orderId: 'order-1',
        reason: '단순 변심',
      });
      expect(screen.getByText(/성공적으로 취소되었습니다/)).toBeInTheDocument();
    });
  });

  it('주문 내역이 없는 상태 탭 선택 시 안내 메시지를 노출한다', () => {
    render(<OrderListViewer initialOrders={sampleOrders} totalCount={2} />);

    const shippingTab = screen.getByRole('button', { name: '배송중' });
    fireEvent.click(shippingTab);

    expect(screen.getByText('해당 상태의 주문 내역이 없습니다.')).toBeInTheDocument();
  });
});
