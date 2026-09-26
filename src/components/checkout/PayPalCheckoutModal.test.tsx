import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PayPalCheckoutModal } from './PayPalCheckoutModal';

describe('PayPalCheckoutModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onApprove: vi.fn().mockResolvedValue(undefined),
    amountKRW: 140000,
    recipientName: '홍길동',
    recipientAddress: '서울시 강남구 테헤란로 123 (06234)',
    orderName: '프리미엄 싱글 코트 외 1건',
  };

  it('isOpen이 true일 때 PayPal 모달과 환율 계산된 USD 금액을 올바르게 렌더링한다', () => {
    render(<PayPalCheckoutModal {...defaultProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getAllByText('PayPal').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('프리미엄 싱글 코트 외 1건')).toBeInTheDocument();

    // 140,000 KRW / 1,400 = $100.00 USD
    expect(screen.getByText('$100.00')).toBeInTheDocument();
    expect(screen.getByText('서울시 강남구 테헤란로 123 (06234)')).toBeInTheDocument();
  });

  it('isOpen이 false이면 아무것도 렌더링하지 않는다', () => {
    const { container } = render(
      <PayPalCheckoutModal {...defaultProps} isOpen={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('닫기 버튼 클릭 시 onClose 콜백이 호출된다', () => {
    render(<PayPalCheckoutModal {...defaultProps} />);

    const closeBtn = screen.getByRole('button', { name: '닫기' });
    fireEvent.click(closeBtn);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('Pay with PayPal 버튼 클릭 시 onApprove 콜백이 승인 데이터와 함께 호출된다', async () => {
    render(<PayPalCheckoutModal {...defaultProps} />);

    const payBtn = screen.getByRole('button', { name: /Pay with/i });
    fireEvent.click(payBtn);

    await waitFor(() => {
      expect(defaultProps.onApprove).toHaveBeenCalledWith(
        expect.objectContaining({
          usdAmount: 100,
          exchangeRate: 1400,
          payerEmail: 'customer@paypal-sandbox.com',
          payerName: '홍길동',
        })
      );
    });
  });

  it('새로운 Sandbox 이메일 입력 후 승인 버튼 클릭 시 해당 입력 이메일로 onApprove가 호출된다', async () => {
    render(<PayPalCheckoutModal {...defaultProps} />);

    const emailInput = screen.getByPlaceholderText('sb-xxxx@personal.example.com');
    fireEvent.change(emailInput, { target: { value: 'sb-buyer99@personal.example.com' } });

    const payBtn = screen.getByRole('button', { name: /Pay with/i });
    fireEvent.click(payBtn);

    await waitFor(() => {
      expect(defaultProps.onApprove).toHaveBeenCalledWith(
        expect.objectContaining({
          usdAmount: 100,
          exchangeRate: 1400,
          payerEmail: 'sb-buyer99@personal.example.com',
          payerName: '홍길동',
        })
      );
    });
  });
});
