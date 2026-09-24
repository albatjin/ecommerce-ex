import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CheckoutStepIndicator } from './CheckoutStepIndicator';

describe('CheckoutStepIndicator Component', () => {
  it('모든 3단계(장바구니, 주문/결제, 주문 완료)를 올바르게 렌더링한다', () => {
    render(<CheckoutStepIndicator currentStep="cart" />);

    expect(screen.getByText('장바구니')).toBeInTheDocument();
    expect(screen.getByText('주문 / 결제')).toBeInTheDocument();
    expect(screen.getByText('주문 완료')).toBeInTheDocument();
  });

  it('currentStep이 "cart"일 때 1단계가 현재 진행 단계로 활성화된다', () => {
    const { container } = render(<CheckoutStepIndicator currentStep="cart" />);

    const stepElements = screen.getAllByRole('listitem');
    expect(stepElements).toHaveLength(3);

    expect(stepElements[0]).toHaveAttribute('aria-current', 'step');
    expect(stepElements[1]).not.toHaveAttribute('aria-current');
    expect(stepElements[2]).not.toHaveAttribute('aria-current');

    // 1단계에는 숫자 01이 표시됨
    expect(stepElements[0]).toHaveTextContent('01');
  });

  it('currentStep이 "checkout"일 때 1단계는 완료 링크로 전환되고 2단계가 활성화된다', () => {
    render(<CheckoutStepIndicator currentStep="checkout" />);

    const stepElements = screen.getAllByRole('listitem');
    expect(stepElements[1]).toHaveAttribute('aria-current', 'step');

    // 1단계(장바구니)는 완료 상태이므로 이전 장바구니로 돌아가는 링크가 활성화됨
    const cartLink = screen.getByRole('link', { name: /장바구니/i });
    expect(cartLink).toHaveAttribute('href', '/cart');
  });

  it('currentStep이 "success"일 때 1, 2단계는 완료 상태가 되고 3단계가 활성화된다', () => {
    render(<CheckoutStepIndicator currentStep="success" />);

    const stepElements = screen.getAllByRole('listitem');
    expect(stepElements[2]).toHaveAttribute('aria-current', 'step');
  });
});

