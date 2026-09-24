import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FreeShippingGauge } from './FreeShippingGauge';

describe('FreeShippingGauge Component', () => {
  it('50,000원 미만 시 남은 금액과 게이지를 안내한다', () => {
    render(<FreeShippingGauge currentAmount={35000} threshold={50000} />);

    expect(screen.getByText(/15,000원/)).toBeInTheDocument();
    expect(screen.getByText(/더 담으면 무료배송/)).toBeInTheDocument();
  });

  it('50,000원 이상 시 무료배송 달성 메시지를 표시한다', () => {
    render(<FreeShippingGauge currentAmount={52000} threshold={50000} />);

    expect(screen.getByText(/무료배송 달성!/)).toBeInTheDocument();
  });
});

