import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { OrderSuccessViewer } from './OrderSuccessViewer';
import type { OrderDetailDTO } from '@/core/application/order/dtos/OrderDTO';

describe('OrderSuccessViewer Component', () => {
  const sampleOrder: OrderDetailDTO = {
    id: 'order-1',
    orderNumber: 'ORD-20260924-00001',
    orderName: '프리미엄 셔츠 외 1건',
    status: 'PAID',
    statusLabel: '결제 완료',
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
        status: 'ORDERED',
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
    createdAt: '2026-09-24T12:00:00.000Z',
  };

  it('주문 완료 안내, 주문번호, 품목, 결제금액 요약을 정상적으로 렌더링한다', () => {
    render(<OrderSuccessViewer order={sampleOrder} />);

    expect(screen.getByText('주문이 정상적으로 완료되었습니다!')).toBeInTheDocument();
    expect(screen.getByText('ORD-20260924-00001')).toBeInTheDocument();
    expect(screen.getByText('프리미엄 셔츠')).toBeInTheDocument();
    expect(screen.getByText('85,000원')).toBeInTheDocument();
    expect(screen.getByText('신용/체크카드')).toBeInTheDocument();
    expect(screen.getByText('홍길동')).toBeInTheDocument();
  });

  it('주문번호 복사 버튼 클릭 시 클립보드 복사 API가 호출된다', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(<OrderSuccessViewer order={sampleOrder} />);

    const copyBtn = screen.getByTitle('주문번호 복사');
    fireEvent.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalledWith('ORD-20260924-00001');
  });
});

