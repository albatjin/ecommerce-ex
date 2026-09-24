import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrderDetailViewer } from './OrderDetailViewer';
import type { OrderDetailDTO } from '@/core/application/order/dtos/OrderDTO';

const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

const mockCancelAction = vi.fn();
const mockReturnAction = vi.fn();
vi.mock('@/app/actions/order.actions', () => ({
  cancelOrderAction: (...args: any[]) => mockCancelAction(...args),
  requestReturnAction: (...args: any[]) => mockReturnAction(...args),
}));

describe('OrderDetailViewer Component', () => {
  const baseOrder: OrderDetailDTO = {
    id: 'order-1',
    orderNumber: 'ORD-20260924-00001',
    orderName: '프리미엄 셔츠 외 1건',
    status: 'SHIPPING',
    statusLabel: '배송 중',
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        productName: '프리미엄 셔츠',
        variantName: '화이트 / L',
        unitPrice: 50000,
        quantity: 2,
        discountAmount: 0,
        totalPrice: 100000,
        status: 'SHIPPED',
      },
    ],
    totalProductAmount: 100000,
    discountAmount: 10000,
    pointUsed: 5000,
    shippingFee: 0,
    totalPaidAmount: 85000,
    payment: {
      method: 'CREDIT_CARD',
      methodLabel: '신용/체크카드',
      status: 'COMPLETED',
      paidAt: '2026-09-24T12:00:00.000Z',
    },
    shippingAddress: {
      recipientName: '홍길동',
      recipientPhone: '010-1234-5678',
      address: '서울시 강남구 테헤란로 123',
      zipcode: '06234',
      message: '문 앞에 놓아주세요',
    },
    tracking: {
      company: 'CJ대한통운',
      number: '682391029384',
    },
    createdAt: '2026-09-24T12:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('주문 번호, 배송 진행 상태 바, 송장 번호, 품목 목록을 렌더링한다', () => {
    render(<OrderDetailViewer order={baseOrder} />);

    expect(screen.getByText('ORD-20260924-00001')).toBeInTheDocument();
    expect(screen.getAllByText('배송 중').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/송장번호: 682391029384/)).toBeInTheDocument();
    expect(screen.getByText('프리미엄 셔츠')).toBeInTheDocument();
    expect(screen.getAllByText('85,000원').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('서울시 강남구 테헤란로 123', { exact: false })).toBeInTheDocument();
  });

  it('결제 완료(PAID) 상태인 주문은 주문 취소 버튼이 노출되며, 취소 모달을 통해 주문을 취소할 수 있다', async () => {
    mockCancelAction.mockResolvedValue({
      success: true,
      data: {
        orderId: 'order-1',
        orderNumber: 'ORD-20260924-00001',
        refundedAmount: 85000,
        refundedPoints: 5000,
      },
    });

    const paidOrder: OrderDetailDTO = {
      ...baseOrder,
      status: 'PAID',
      statusLabel: '결제 완료',
    };

    render(<OrderDetailViewer order={paidOrder} />);

    // 주문 취소 버튼 확인 및 클릭
    const cancelBtn = screen.getByRole('button', { name: '주문 취소' });
    expect(cancelBtn).toBeInTheDocument();
    fireEvent.click(cancelBtn);

    // 모달 타이틀 확인
    expect(screen.getAllByText('주문 취소 신청').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('환불 예정 금액')).toBeInTheDocument();

    // 취소 사유 선택 및 확정 클릭
    const confirmCancelBtn = screen.getByRole('button', { name: '주문 취소 확정' });
    fireEvent.click(confirmCancelBtn);

    await waitFor(() => {
      expect(mockCancelAction).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: 'order-1',
        })
      );
      expect(mockRefresh).toHaveBeenCalled();
      expect(screen.getByText(/주문 취소가 완료되었습니다/)).toBeInTheDocument();
    });
  });

  it('배송 완료(DELIVERED) 상태인 주문은 반품 신청 버튼이 노출되며, 반품 모달을 통해 접수할 수 있다', async () => {
    mockReturnAction.mockResolvedValue({
      success: true,
      data: {
        orderId: 'order-1',
        orderNumber: 'ORD-20260924-00001',
        status: 'RETURN_REQUESTED',
      },
    });

    const deliveredOrder: OrderDetailDTO = {
      ...baseOrder,
      status: 'DELIVERED',
      statusLabel: '배송 완료',
    };

    render(<OrderDetailViewer order={deliveredOrder} />);

    // 반품 신청 버튼 확인 및 클릭
    const returnBtn = screen.getByRole('button', { name: '반품 신청' });
    expect(returnBtn).toBeInTheDocument();
    fireEvent.click(returnBtn);

    // 모달 확인
    expect(screen.getAllByText('반품 신청 접수').length).toBeGreaterThanOrEqual(1);

    // 반품 신청 접수 버튼 클릭
    const confirmReturnButtons = screen.getAllByRole('button', { name: '반품 신청 접수' });
    fireEvent.click(confirmReturnButtons[confirmReturnButtons.length - 1]);

    await waitFor(() => {
      expect(mockReturnAction).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: 'order-1',
        })
      );
      expect(mockRefresh).toHaveBeenCalled();
      expect(screen.getByText(/반품 신청이 성공적으로 접수되었습니다/)).toBeInTheDocument();
    });
  });

  it('취소 완료(CANCELLED) 주문은 취소 완료 안내 배너가 렌더링되고 취소/반품 버튼이 없다', () => {
    const cancelledOrder: OrderDetailDTO = {
      ...baseOrder,
      status: 'CANCELLED',
      statusLabel: '주문 취소',
    };

    render(<OrderDetailViewer order={cancelledOrder} />);

    expect(screen.getByText('주문이 정상적으로 취소되었습니다.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '주문 취소' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '반품 신청' })).not.toBeInTheDocument();
  });
});
