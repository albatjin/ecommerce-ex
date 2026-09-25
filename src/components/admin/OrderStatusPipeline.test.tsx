import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { OrderStatusPipeline } from './OrderStatusPipeline';
import type { OrderStatusPipelineItem } from '@/core/application/admin/dtos/AdminSalesAnalyticsDTO';

describe('OrderStatusPipeline Component', () => {
  const samplePipeline: OrderStatusPipelineItem[] = [
    { status: 'PAID', label: '결제완료', count: 12, percentage: 40.0, color: 'bg-blue-500' },
    { status: 'PREPARING', label: '상품준비', count: 6, percentage: 20.0, color: 'bg-amber-500' },
    { status: 'SHIPPING', label: '배송중', count: 6, percentage: 20.0, color: 'bg-indigo-500' },
    { status: 'DELIVERED', label: '배송완료', count: 4, percentage: 13.3, color: 'bg-emerald-500' },
    { status: 'CANCELLED', label: '주문취소', count: 2, percentage: 6.7, color: 'bg-rose-500' },
  ];

  it('주문 상태 파이프라인 헤더와 총 주문 건수를 올바르게 렌더링한다', () => {
    render(<OrderStatusPipeline pipeline={samplePipeline} totalOrders={30} />);

    expect(screen.getByText('주문 상태별 파이프라인')).toBeDefined();
    expect(screen.getByText('30건')).toBeDefined();
  });

  it('각 상태별 라벨, 건수, 점유율 백분율을 정확히 표시한다', () => {
    render(<OrderStatusPipeline pipeline={samplePipeline} totalOrders={30} />);

    expect(screen.getByText('결제완료')).toBeDefined();
    expect(screen.getByText('12')).toBeDefined();
    expect(screen.getByText('40%')).toBeDefined();

    expect(screen.getByText('배송완료')).toBeDefined();
    expect(screen.getByText('4')).toBeDefined();
    expect(screen.getByText('13.3%')).toBeDefined();

    expect(screen.getByText('주문취소')).toBeDefined();
    expect(screen.getByText('2')).toBeDefined();
    expect(screen.getByText('6.7%')).toBeDefined();
  });

  it('취소/반품 상태의 카드는 클레임 관리 링크(/admin/claims)를 연결한다', () => {
    render(<OrderStatusPipeline pipeline={samplePipeline} totalOrders={30} />);

    const cancelCard = screen.getByText('주문취소').closest('a');
    expect(cancelCard?.getAttribute('href')).toBe('/admin/claims');

    const paidCard = screen.getByText('결제완료').closest('a');
    expect(paidCard?.getAttribute('href')).toBe('/admin/orders');
  });
});
