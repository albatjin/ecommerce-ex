import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AdminDashboardViewer } from './AdminDashboardViewer';
import type { AdminDashboardDTO } from '@/core/application/admin/dtos/AdminDashboardDTO';

describe('AdminDashboardViewer Component', () => {
  const sampleData: AdminDashboardDTO = {
    totalRevenue: 2450000,
    todayRevenue: 180000,
    totalOrdersCount: 42,
    todayOrdersCount: 5,
    pendingClaimsCount: 3,
    pendingReturnsCount: 2,
    pendingCancelsCount: 1,
    pendingInquiriesCount: 2,
    totalInquiriesCount: 15,
    recentOrders: [
      {
        id: 'ord-1',
        orderNumber: 'ORD-20260925-00010',
        orderName: '프리미엄 린넨 셔츠 외 1건',
        status: 'PAID',
        statusLabel: '결제 완료',
        itemCount: 2,
        firstItemImageUrl: null,
        totalPaidAmount: 89000,
        paymentMethodLabel: '신용/체크카드',
        createdAt: '2026-09-25T10:00:00.000Z',
      },
    ],
    recentPendingInquiries: [
      {
        id: 'inq-1',
        customerId: 'user-1',
        customerName: '김철수',
        customerEmail: 'chulsoo@example.com',
        orderId: 'ORD-20260925-00010',
        category: 'SHIPPING',
        categoryLabel: '배송 문의',
        title: '당일 출고 가능한가요?',
        content: '오후 2시 전 주문했는데 오늘 발송되는지 궁금합니다.',
        status: 'PENDING',
        statusLabel: '답변 대기',
        answer: null,
        answeredAt: null,
        createdAt: '2026-09-25T11:00:00.000Z',
      },
    ],
    generatedAt: '2026-09-25T12:00:00.000Z',
  };

  it('4대 핵심 KPI 카드(매출, 주문, 클레임, 미답변 문의)를 올바른 수치와 단위로 렌더링한다', () => {
    render(<AdminDashboardViewer initialData={sampleData} />);

    // KPI 1: 매출액
    expect(screen.getByText('총 누적 매출액')).toBeDefined();
    expect(screen.getByText(/2,450,000/)).toBeDefined();
    expect(screen.getByText(/\+180,000원/)).toBeDefined();

    // KPI 2: 주문 건수
    expect(screen.getByText('주문 접수 건수')).toBeDefined();
    expect(screen.getByText('42')).toBeDefined();
    expect(screen.getByText(/\+5건/)).toBeDefined();

    // KPI 3: 클레임 건수
    expect(screen.getByText('취소 / 반품 요청')).toBeDefined();
    expect(screen.getByText('3')).toBeDefined();
    expect(screen.getByText('반품 2건')).toBeDefined();
    expect(screen.getByText('취소 1건')).toBeDefined();

    // KPI 4: 1:1 문의 건수
    expect(screen.getByText('미답변 CS 문의')).toBeDefined();
    expect(screen.getByText('2')).toBeDefined();
    expect(screen.getByText('총 접수: 15건')).toBeDefined();
  });

  it('긴급 처리 항목(클레임 3건, 문의 2건)이 있을 때 경고 알림 배너를 노출한다', () => {
    render(<AdminDashboardViewer initialData={sampleData} />);

    expect(screen.getByText(/반품\/취소 검수 3건/)).toBeDefined();
    expect(screen.getByText(/미답변 1:1 문의 2건/)).toBeDefined();
    expect(screen.getByRole('link', { name: /클레임 검수하기/i })).toBeDefined();
    expect(screen.getByRole('link', { name: /문의 답변하기/i })).toBeDefined();
  });

  it('최근 실시간 주문 내역과 답변 대기 문의 목록 위젯을 정상 렌더링한다', () => {
    render(<AdminDashboardViewer initialData={sampleData} />);

    // 최근 주문
    expect(screen.getByText('최근 실시간 주문 내역')).toBeDefined();
    expect(screen.getByText('ORD-20260925-00010')).toBeDefined();
    expect(screen.getByText('프리미엄 린넨 셔츠 외 1건')).toBeDefined();
    expect(screen.getByText('89,000원')).toBeDefined();
    expect(screen.getByText('결제 완료')).toBeDefined();

    // 답변 대기 문의
    expect(screen.getByText('답변 대기 문의')).toBeDefined();
    expect(screen.getByText('당일 출고 가능한가요?')).toBeDefined();
    expect(screen.getByText('김철수')).toBeDefined();
    expect(screen.getByText('배송 문의')).toBeDefined();
  });
});
