import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { OrderDetailViewer } from './OrderDetailViewer';
import type { OrderDetailDTO } from '@/core/application/order/dtos/OrderDTO';

describe('OrderDetailViewer Component', () => {
  const sampleOrderDetail: OrderDetailDTO = {
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

  it('주문 번호, 배송 진행 상태 바, 송장 번호, 품목 목록을 렌더링한다', () => {
    render(<OrderDetailViewer order={sampleOrderDetail} />);

    expect(screen.getByText('ORD-20260924-00001')).toBeInTheDocument();
    expect(screen.getAllByText('배송 중').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/송장번호: 682391029384/)).toBeInTheDocument();
    expect(screen.getByText('프리미엄 셔츠')).toBeInTheDocument();
    expect(screen.getAllByText('85,000원').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('서울시 강남구 테헤란로 123', { exact: false })).toBeInTheDocument();
  });
});
