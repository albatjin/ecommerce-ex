import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CheckoutViewer } from './CheckoutViewer';
import type { CheckoutDataDTO } from '@/core/application/order/dtos/CheckoutDTO';

// Mock useRouter
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockCreateOrderAction = vi.fn();
const mockApprovePaymentAction = vi.fn();
vi.mock('@/app/actions/order.actions', () => ({
  createOrderAction: (...args: any[]) => mockCreateOrderAction(...args),
  approvePaymentAction: (...args: any[]) => mockApprovePaymentAction(...args),
}));

describe('CheckoutViewer Component', () => {
  const sampleData: CheckoutDataDTO = {
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        productName: '캐시미어 코트',
        variantName: '블랙 / L',
        price: 150000,
        quantity: 1,
        subtotal: 150000,
        coverImageUrl: 'https://example.com/coat.jpg',
      },
    ],
    productTotal: 150000,
    shippingFee: 0,
    availableCoupons: [
      {
        id: 'coupon-1',
        name: '10,000원 주말 특가 쿠폰',
        discountAmount: 10000,
        minOrderAmount: 50000,
        calculatedDiscount: 10000,
        isUsable: true,
        expiresAt: '2026-12-31T23:59:59.000Z',
      },
    ],
    availablePoints: 5000,
    maxPointsUsable: 5000,
    defaultShippingAddress: {
      recipientName: '홍길동',
      recipientPhone: '010-1234-5678',
      address: '서울시 강남구 테헤란로 123',
      zipcode: '06234',
      message: '부재 시 문 앞에 놓아주세요',
    },
  };

  it('배송지, 주문 품목, 결제 수단, 결제 요약 카드를 정상 렌더링한다', () => {
    render(<CheckoutViewer initialData={sampleData} />);

    expect(screen.getByRole('heading', { name: '주문 / 결제', level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/주문 상품 목록/)).toBeInTheDocument();
    expect(screen.getByText('캐시미어 코트')).toBeInTheDocument();
    expect(screen.getByDisplayValue('홍길동')).toBeInTheDocument();
    expect(screen.getByDisplayValue('010-1234-5678')).toBeInTheDocument();
    expect(screen.getByText('신용/체크카드')).toBeInTheDocument();
    expect(screen.getByText('150,000원 결제하기')).toBeInTheDocument();
  });

  it('쿠폰을 선택하면 할인 금액이 실시간으로 차감 계산된다', async () => {
    render(<CheckoutViewer initialData={sampleData} />);

    const couponSelect = screen.getByRole('combobox', { name: '' });
    // 첫번째 select (쿠폰 선택)
    fireEvent.change(screen.getByDisplayValue('쿠폰을 선택해 주세요 (적용 안 함)'), {
      target: { value: 'coupon-1' },
    });

    // 150,000원 - 10,000원 = 140,000원 결제하기로 변경
    await waitFor(() => {
      expect(screen.getByText('140,000원 결제하기')).toBeInTheDocument();
      expect(screen.getByText(/-10,000원 적용됨/)).toBeInTheDocument();
    });
  });

  it('적립금 전액 사용 버튼을 누르면 최대 사용 가능 포인트가 자동 적용된다', async () => {
    render(<CheckoutViewer initialData={sampleData} />);

    const useAllPointsBtn = screen.getByText('전액 사용');
    fireEvent.click(useAllPointsBtn);

    // 150,000원 - 5,000P = 145,000원
    await waitFor(() => {
      expect(screen.getByText('145,000원 결제하기')).toBeInTheDocument();
    });
  });

  it('PayPal 결제 수단을 선택하면 PayPal 전용 결제 버튼과 환율 계산 금액이 표시된다', async () => {
    render(<CheckoutViewer initialData={sampleData} />);

    const paypalBtn = screen.getByText('PayPal (페이팔)');
    fireEvent.click(paypalBtn);

    // 150,000원 / 1,400 = 약 $107.14 USD
    await waitFor(() => {
      expect(screen.getByText(/Pay with/i)).toBeInTheDocument();
      expect(screen.getByText(/PayPal 글로벌 간편결제/)).toBeInTheDocument();
      expect(screen.getAllByText(/\$107.14 USD/).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('필수 배송지 정보가 누락되면 에러 메시지를 표시하고 주문 제출을 중단한다', async () => {
    const onPlaceOrderMock = vi.fn();
    render(
      <CheckoutViewer
        initialData={{
          ...sampleData,
          defaultShippingAddress: undefined,
        }}
        onPlaceOrder={onPlaceOrderMock}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /결제하기/ });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/수령인 이름을 입력해 주세요/)).toBeInTheDocument();
    expect(onPlaceOrderMock).not.toHaveBeenCalled();
  });

  it('정상 입력 후 결제하기를 누르면 onPlaceOrder 콜백이 올바른 파라미터로 호출된다', async () => {
    const onPlaceOrderMock = vi.fn().mockResolvedValue(undefined);
    render(
      <CheckoutViewer
        initialData={sampleData}
        onPlaceOrder={onPlaceOrderMock}
      />
    );

    // 네이버페이 선택
    fireEvent.click(screen.getByText('네이버페이'));

    // 결제하기 버튼 클릭
    const submitBtn = screen.getByRole('button', { name: /결제하기/ });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onPlaceOrderMock).toHaveBeenCalledWith(
        expect.objectContaining({
          shippingAddress: expect.objectContaining({
            recipientName: '홍길동',
            recipientPhone: '010-1234-5678',
            zipcode: '06234',
            address: '서울시 강남구 테헤란로 123',
          }),
          paymentMethod: 'NAVER_PAY',
        })
      );
    });
  });

  it('onPlaceOrder가 없으면 createOrderAction과 approvePaymentAction을 호출하여 주문 및 결제를 완료한다', async () => {
    mockCreateOrderAction.mockResolvedValue({
      success: true,
      data: { orderId: 'ord-101', orderNumber: 'ORD-20260924-00099' },
    });
    mockApprovePaymentAction.mockResolvedValue({
      success: true,
      data: { orderId: 'ord-101', orderNumber: 'ORD-20260924-00099', status: 'PAID' },
    });
    vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(<CheckoutViewer initialData={sampleData} />);

    const submitBtn = screen.getByRole('button', { name: /결제하기/ });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreateOrderAction).toHaveBeenCalledTimes(1);
      expect(mockApprovePaymentAction).toHaveBeenCalledWith('ord-101');
      expect(mockPush).toHaveBeenCalledWith(
        '/checkout/success?orderNumber=ORD-20260924-00099'
      );
    });
  });
});

