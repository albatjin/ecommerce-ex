import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createOrderAction,
  approvePaymentAction,
  getOrderAction,
  getUserOrdersAction,
  cancelOrderAction,
  requestReturnAction,
} from './order.actions';
import { ok, fail } from '@/core/domain/shared/Result';
import { DomainError } from '@/core/domain/shared/AppError';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

const mockGetUser = vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } });
vi.mock('@/core/infrastructure/supabase/server', () => ({
  getServerClient: vi.fn().mockImplementation(() => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

vi.mock('./cart.actions', () => ({
  getCartSessionId: vi.fn().mockResolvedValue({ cartId: 'cart-session-123', isGuest: false }),
}));

const mockExecute = vi.fn();
vi.mock('@/core/application/order/use-cases/CreateOrderUseCase', () => {
  return {
    CreateOrderUseCase: class {
      execute = mockExecute;
    },
  };
});

const mockApproveExecute = vi.fn();
vi.mock('@/core/application/order/use-cases/ApprovePaymentUseCase', () => {
  return {
    ApprovePaymentUseCase: class {
      execute = mockApproveExecute;
    },
  };
});

const mockGetOrderExecute = vi.fn();
vi.mock('@/core/application/order/use-cases/GetOrderUseCase', () => {
  return {
    GetOrderUseCase: class {
      execute = mockGetOrderExecute;
    },
  };
});

const mockGetUserOrdersExecute = vi.fn();
vi.mock('@/core/application/order/use-cases/GetUserOrdersUseCase', () => {
  return {
    GetUserOrdersUseCase: class {
      execute = mockGetUserOrdersExecute;
    },
  };
});

const mockCancelExecute = vi.fn();
vi.mock('@/core/application/order/use-cases/CancelOrderUseCase', () => {
  return {
    CancelOrderUseCase: class {
      execute = mockCancelExecute;
    },
  };
});

const mockReturnExecute = vi.fn();
vi.mock('@/core/application/order/use-cases/RequestReturnUseCase', () => {
  return {
    RequestReturnUseCase: class {
      execute = mockReturnExecute;
    },
  };
});

vi.mock('@/core/infrastructure/gateways/MockPaymentGateway', () => ({
  MockPaymentGateway: class {},
}));

vi.mock('@/core/infrastructure/repositories/CookieCartRepository', () => {
  return {
    CookieCartRepository: class {
      getCart = vi.fn().mockResolvedValue({
        selectedItems: () => [
          { productId: 'prod-1', variantId: null, quantity: 2 },
        ],
      });
      saveCart = vi.fn().mockResolvedValue(undefined);
    },
  };
});

vi.mock('@/core/infrastructure/repositories/SupabaseOrderRepository', () => ({
  SupabaseOrderRepository: class {},
}));
vi.mock('@/core/infrastructure/repositories/SupabaseProductRepository', () => ({
  SupabaseProductRepository: class {},
}));
vi.mock('@/core/infrastructure/repositories/SupabaseCouponRepository', () => ({
  SupabaseCouponRepository: class {},
}));
vi.mock('@/core/infrastructure/repositories/SupabasePointRepository', () => ({
  SupabasePointRepository: class {},
}));

describe('order.actions - createOrderAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
  });

  const baseInput = {
    shippingAddress: {
      recipientName: '홍길동',
      recipientPhone: '010-1234-5678',
      address: '서울시 강남구',
      zipcode: '06234',
    },
    paymentMethod: 'CREDIT_CARD' as const,
  };

  it('유스케이스 실행 성공 시 성공 응답을 반환하고 경로를 재검증한다', async () => {
    mockExecute.mockResolvedValue(
      ok({
        orderId: 'order-1',
        orderNumber: 'ORD-20260924-00001',
        totalProductAmount: 50000,
        discountAmount: 0,
        pointUsed: 0,
        shippingFee: 0,
        totalPaidAmount: 50000,
        status: 'PAYMENT_PENDING',
      })
    );

    const result = await createOrderAction({
      ...baseInput,
      items: [{ productId: 'prod-1', quantity: 2 }],
    });

    expect(result.success).toBe(true);
    expect(result.data?.orderNumber).toBe('ORD-20260924-00001');
    expect(result.data?.totalPaidAmount).toBe(50000);
  });

  it('유스케이스가 실패를 반환하면 에러 메시지와 함께 실패를 반환한다', async () => {
    mockExecute.mockResolvedValue(fail(new DomainError('재고가 부족합니다.')));

    const result = await createOrderAction({
      ...baseInput,
      items: [{ productId: 'prod-1', quantity: 100 }],
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('재고가 부족합니다.');
  });

  it('items가 비어있으면 장바구니에서 선택된 품목을 자동으로 추출하여 사용한다', async () => {
    mockExecute.mockResolvedValue(
      ok({
        orderId: 'order-1',
        orderNumber: 'ORD-20260924-00002',
        totalProductAmount: 30000,
        discountAmount: 0,
        pointUsed: 0,
        shippingFee: 3000,
        totalPaidAmount: 33000,
        status: 'PAYMENT_PENDING',
      })
    );

    const result = await createOrderAction(baseInput);

    expect(result.success).toBe(true);
    expect(mockExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [{ productId: 'prod-1', variantId: null, quantity: 2 }],
      })
    );
  });
});

describe('order.actions - approvePaymentAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('결제 승인 성공 시 PAID 상태 및 거래 ID를 반환한다', async () => {
    const paidAt = new Date();
    mockApproveExecute.mockResolvedValue(
      ok({
        orderId: 'order-1',
        orderNumber: 'ORD-20260924-00001',
        status: 'PAID',
        paidAt,
        transactionId: 'PG_TX_123456',
        totalPaidAmount: 50000,
      })
    );

    const result = await approvePaymentAction('order-1');

    expect(result.success).toBe(true);
    expect(result.data?.status).toBe('PAID');
    expect(result.data?.transactionId).toBe('PG_TX_123456');
    expect(mockApproveExecute).toHaveBeenCalledWith({
      orderId: 'order-1',
      paymentDetails: undefined,
    });
  });

  it('결제 승인 실패 시 에러 메시지를 반환한다', async () => {
    mockApproveExecute.mockResolvedValue(fail(new DomainError('결제 한도 초과')));

    const result = await approvePaymentAction('order-1');

    expect(result.success).toBe(false);
    expect(result.error).toBe('결제 한도 초과');
  });
});

describe('order.actions - getOrderAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
  });

  it('주문 번호로 조회 시 성공 데이터를 반환한다', async () => {
    mockGetOrderExecute.mockResolvedValue(
      ok({
        id: 'order-1',
        orderNumber: 'ORD-20260924-00001',
        orderName: '샘플 상품 외 1건',
        status: 'PAID',
        statusLabel: '결제 완료',
      })
    );

    const result = await getOrderAction({ orderNumber: 'ORD-20260924-00001' });

    expect(result.success).toBe(true);
    expect(result.data?.orderNumber).toBe('ORD-20260924-00001');
    expect(result.data?.statusLabel).toBe('결제 완료');
  });
});

describe('order.actions - getUserOrdersAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
  });

  it('비로그인 사용자가 주문 목록 조회 시 실패를 반환한다', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });

    const result = await getUserOrdersAction();

    expect(result.success).toBe(false);
    expect(result.error).toContain('로그인');
  });

  it('로그인 사용자의 주문 목록 조회가 성공한다', async () => {
    mockGetUserOrdersExecute.mockResolvedValue(
      ok({
        orders: [
          {
            id: 'order-1',
            orderNumber: 'ORD-20260924-00001',
            orderName: '샘플 상품',
            totalPaidAmount: 30000,
          },
        ],
        totalCount: 1,
      })
    );

    const result = await getUserOrdersAction();

    expect(result.success).toBe(true);
    expect(result.data?.totalCount).toBe(1);
    expect(result.data?.orders.length).toBe(1);
  });
});

describe('order.actions - cancelOrderAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
  });

  it('주문 취소 유즈케이스가 성공하면 결과를 반환한다', async () => {
    mockCancelExecute.mockResolvedValue(
      ok({
        orderId: 'order-1',
        orderNumber: 'ORD-20260924-00001',
        cancelledAt: new Date(),
        refundedAmount: 50000,
        refundedPoints: 3000,
      })
    );

    const result = await cancelOrderAction({
      orderId: 'order-1',
      reason: '단순 변심',
    });

    expect(result.success).toBe(true);
    expect(result.data?.orderNumber).toBe('ORD-20260924-00001');
    expect(result.data?.refundedAmount).toBe(50000);
    expect(result.data?.refundedPoints).toBe(3000);
  });

  it('주문 취소 유즈케이스가 실패하면 에러를 반환한다', async () => {
    mockCancelExecute.mockResolvedValue(
      fail(new DomainError('배송 중 상태에서는 주문을 즉시 취소할 수 없습니다.'))
    );

    const result = await cancelOrderAction({
      orderId: 'order-1',
      reason: '취소 요청',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('즉시 취소할 수 없습니다');
  });
});

describe('order.actions - requestReturnAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
  });

  it('반품 신청 유즈케이스가 성공하면 결과를 반환한다', async () => {
    mockReturnExecute.mockResolvedValue(
      ok({
        orderId: 'order-1',
        orderNumber: 'ORD-20260924-00001',
        status: 'RETURN_REQUESTED',
        requestedAt: new Date(),
        reason: '상품 불량/파손',
      })
    );

    const result = await requestReturnAction({
      orderId: 'order-1',
      reason: '상품 불량/파손',
    });

    expect(result.success).toBe(true);
    expect(result.data?.status).toBe('RETURN_REQUESTED');
    expect(result.data?.reason).toBe('상품 불량/파손');
  });

  it('반품 신청 유즈케이스가 실패하면 에러를 반환한다', async () => {
    mockReturnExecute.mockResolvedValue(
      fail(new DomainError('배송 완료(DELIVERED) 상태인 주문만 반품 신청이 가능합니다.'))
    );

    const result = await requestReturnAction({
      orderId: 'order-1',
      reason: '단순 변심',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('배송 완료');
  });
});

