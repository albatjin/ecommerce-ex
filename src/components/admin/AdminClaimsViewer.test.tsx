import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminClaimsViewer } from './AdminClaimsViewer';
import type { OrderListItemDTO } from '@/core/application/order/dtos/OrderDTO';

const mockApproveReturnAction = vi.fn();
const mockRejectReturnAction = vi.fn();

vi.mock('@/app/actions/order.actions', () => ({
  approveReturnAction: (...args: any[]) => mockApproveReturnAction(...args),
  rejectReturnAction: (...args: any[]) => mockRejectReturnAction(...args),
}));

describe('AdminClaimsViewer Component', () => {
  const sampleOrders: OrderListItemDTO[] = [
    {
      id: 'order-1',
      orderNumber: 'ORD-20260924-00001',
      orderName: '프리미엄 셔츠 외 1건',
      status: 'RETURN_REQUESTED',
      statusLabel: '반품 요청',
      itemCount: 2,
      firstItemImageUrl: null,
      totalPaidAmount: 85000,
      paymentMethodLabel: '신용/체크카드',
      createdAt: '2026-09-24T12:00:00.000Z',
    },
    {
      id: 'order-2',
      orderNumber: 'ORD-20260924-00002',
      orderName: '캐시미어 니트',
      status: 'CANCELLED',
      statusLabel: '주문 취소',
      itemCount: 1,
      firstItemImageUrl: null,
      totalPaidAmount: 50000,
      paymentMethodLabel: '카카오페이',
      createdAt: '2026-09-24T14:00:00.000Z',
    },
    {
      id: 'order-3',
      orderNumber: 'ORD-20260924-00003',
      orderName: '베이직 티셔츠',
      status: 'PAID',
      statusLabel: '결제 완료',
      itemCount: 1,
      firstItemImageUrl: null,
      totalPaidAmount: 25000,
      paymentMethodLabel: '토스페이',
      createdAt: '2026-09-24T15:00:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('클레임 목록 및 탭 필터를 렌더링하고 기본적으로 클레임(반품요청, 취소 등) 주문만 표시한다', () => {
    render(<AdminClaimsViewer initialOrders={sampleOrders} totalCount={3} />);

    expect(screen.getByText('클레임 및 반품 관리')).toBeInTheDocument();
    expect(screen.getByText('ORD-20260924-00001')).toBeInTheDocument();
    expect(screen.getByText('ORD-20260924-00002')).toBeInTheDocument();
    // 'PAID' 주문은 기본 CLAIMS_ALL 탭에서는 필터링되어 보이지 않아야 함
    expect(screen.queryByText('ORD-20260924-00003')).not.toBeInTheDocument();
  });

  it('반품 요청 주문에 대해 반품 승인 모달을 열고 승인을 실행하면 상태가 RETURNED로 업데이트된다', async () => {
    mockApproveReturnAction.mockResolvedValue({
      success: true,
      data: {
        orderId: 'order-1',
        orderNumber: 'ORD-20260924-00001',
        status: 'RETURNED',
        refundedAmount: 85000,
        refundedPoints: 5000,
      },
    });

    render(<AdminClaimsViewer initialOrders={sampleOrders} totalCount={3} />);

    const approveBtn = screen.getByRole('button', { name: /반품 승인 및 환불/ });
    expect(approveBtn).toBeInTheDocument();
    fireEvent.click(approveBtn);

    // 모달 렌더링 확인
    expect(screen.getByText('반품 승인 및 환불 처리')).toBeInTheDocument();

    // 승인 확정 버튼 클릭
    const confirmBtn = screen.getByRole('button', { name: '환불 집행 및 승인' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockApproveReturnAction).toHaveBeenCalledWith({
        orderId: 'order-1',
        adminNote: undefined,
      });
      expect(screen.getByText(/반품 승인 및 결제 환불/)).toBeInTheDocument();
    });
  });

  it('반품 요청 주문에 대해 반품 반려 모달을 열고 사유 입력 후 반려를 실행하면 상태가 배송 완료로 복귀한다', async () => {
    mockRejectReturnAction.mockResolvedValue({
      success: true,
      data: {
        orderId: 'order-1',
        orderNumber: 'ORD-20260924-00001',
        status: 'DELIVERED',
        rejectionReason: '상품 훼손 확인',
      },
    });

    render(<AdminClaimsViewer initialOrders={sampleOrders} totalCount={3} />);

    const rejectBtn = screen.getByRole('button', { name: '반품 반려' });
    expect(rejectBtn).toBeInTheDocument();
    fireEvent.click(rejectBtn);

    // 모달 렌더링 확인
    expect(screen.getByText('반품 요청 반려')).toBeInTheDocument();

    // 반려 사유 입력
    const textarea = screen.getByPlaceholderText(/고객 부주의/);
    fireEvent.change(textarea, { target: { value: '상품 훼손 확인' } });

    // 반려 확정 버튼 클릭
    const confirmBtn = screen.getByRole('button', { name: '반려 확정' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockRejectReturnAction).toHaveBeenCalledWith({
        orderId: 'order-1',
        reason: '상품 훼손 확인',
      });
      expect(screen.getByText(/정상적으로 반려\(거절\)되었습니다/)).toBeInTheDocument();
    });
  });
});

