import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createOrderAction,
  approvePaymentAction,
  getOrderAction,
  getUserOrdersAction,
  cancelOrderAction,
  requestReturnAction,
  approveReturnAction,
  rejectReturnAction,
  getAdminOrdersAction,
  updateOrderDeliveryAction,
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

const mockApproveReturnExecute = vi.fn();
vi.mock('@/core/application/order/use-cases/ApproveReturnUseCase', () => {
  return {
    ApproveReturnUseCase: class {
      execute = mockApproveReturnExecute;
    },
  };
});

const mockRejectReturnExecute = vi.fn();
vi.mock('@/core/application/order/use-cases/RejectReturnUseCase', () => {
  return {
    RejectReturnUseCase: class {
      execute = mockRejectReturnExecute;
    },
  };
});

const mockGetAdminOrdersExecute = vi.fn();
vi.mock('@/core/application/order/use-cases/GetAdminOrdersUseCase', () => {
  return {
    GetAdminOrdersUseCase: class {
      execute = mockGetAdminOrdersExecute;
    },
  };
});

const mockUpdateOrderDeliveryExecute = vi.fn();
vi.mock('@/core/application/order/use-cases/UpdateOrderDeliveryUseCase', () => {
  return {
    UpdateOrderDeliveryUseCase: class {
      execute = mockUpdateOrderDeliveryExecute;
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

describe('order.actions - approveReturnAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('반품 승인 유즈케이스가 성공하면 성공 결과를 반환한다', async () => {
    mockApproveReturnExecute.mockResolvedValue(
      ok({
        orderId: 'order-1',
        orderNumber: 'ORD-20260924-00001',
        status: 'RETURNED',
        returnedAt: new Date(),
        refundedAmount: 50000,
        refundedPoints: 3000,
        refundTransactionId: 'REF_123',
      })
    );

    const result = await approveReturnAction({
      orderId: 'order-1',
      adminNote: '검수 통과',
    });

    expect(result.success).toBe(true);
    expect(result.data?.status).toBe('RETURNED');
    expect(result.data?.refundedAmount).toBe(50000);
  });

  it('반품 승인 유즈케이스가 실패하면 에러를 반환한다', async () => {
    mockApproveReturnExecute.mockResolvedValue(
      fail(new DomainError("반품 요청('RETURN_REQUESTED') 상태의 주문만 반품을 승인할 수 있습니다."))
    );

    const result = await approveReturnAction({
      orderId: 'order-1',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('RETURN_REQUESTED');
  });
});

describe('order.actions - rejectReturnAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('반품 반려 유즈케이스가 성공하면 성공 결과를 반환한다', async () => {
    mockRejectReturnExecute.mockResolvedValue(
      ok({
        orderId: 'order-1',
        orderNumber: 'ORD-20260924-00001',
        status: 'DELIVERED',
        rejectionReason: '부속품 누락',
        rejectedAt: new Date(),
      })
    );

    const result = await rejectReturnAction({
      orderId: 'order-1',
      reason: '부속품 누락',
    });

    expect(result.success).toBe(true);
    expect(result.data?.status).toBe('DELIVERED');
    expect(result.data?.rejectionReason).toBe('부속품 누락');
  });

  it('반품 반려 유즈케이스가 실패하면 에러를 반환한다', async () => {
    mockRejectReturnExecute.mockResolvedValue(
      fail(new DomainError('반품 반려 사유는 필수 입력 사항입니다.'))
    );

    const result = await rejectReturnAction({
      orderId: 'order-1',
      reason: '',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('필수 입력');
  });
});

describe('order.actions - getAdminOrdersAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('관리자 주문 목록 조회가 성공한다', async () => {
    mockGetAdminOrdersExecute.mockResolvedValue(
      ok({
        orders: [
          {
            id: 'order-1',
            orderNumber: 'ORD-20260924-00001',
            orderName: '샘플 상품',
            status: 'RETURN_REQUESTED',
            totalPaidAmount: 50000,
          },
        ],
        totalCount: 1,
      })
    );

    const result = await getAdminOrdersAction({
      filterType: 'CLAIMS_ALL',
    });

    expect(result.success).toBe(true);
    expect(result.data?.orders.length).toBe(1);
    expect(result.data?.orders[0].status).toBe('RETURN_REQUESTED');
  });
});

describe('order.actions - updateOrderDeliveryAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('관리자가 주문의 배송 상태를 성공적으로 변경한다', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: {
        user: {
          id: 'admin-1',
          email: 'albat77@nate.com',
          user_metadata: { role: 'admin' },
        },
      },
    });

    mockUpdateOrderDeliveryExecute.mockResolvedValueOnce(
      ok({
        orderId: 'order-1',
        orderNumber: 'ORD-20260925-00001',
        status: 'SHIPPING',
        statusLabel: '배송 중',
        trackingCompany: 'CJ대한통운',
        trackingNumber: '123456789',
        shippedAt: '2026-09-25T00:00:00Z',
        deliveredAt: null,
      })
    );

    const result = await updateOrderDeliveryAction({
      orderId: 'order-1',
      targetStatus: 'SHIPPING',
      trackingCompany: 'CJ대한통운',
      trackingNumber: '123456789',
    });

    expect(result.success).toBe(true);
    expect(result.data?.status).toBe('SHIPPING');
    expect(result.data?.trackingCompany).toBe('CJ대한통운');
    expect(result.data?.trackingNumber).toBe('123456789');
  });

  it('권한이 없는 사용자가 호출하면 실패한다', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: {
        user: {
          id: 'user-normal',
          email: 'user@normal.com',
          user_metadata: { role: 'customer' },
        },
      },
    });

    const result = await updateOrderDeliveryAction({
      orderId: 'order-1',
      targetStatus: 'PREPARING',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('관리자 권한');
  });

  it('UseCase에서 에러를 반환하면 액션도 실패를 반환한다', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: {
        user: {
          id: 'admin-1',
          email: 'albat77@nate.com',
          user_metadata: { role: 'admin' },
        },
      },
    });

    mockUpdateOrderDeliveryExecute.mockResolvedValueOnce(
      fail(new DomainError('송장 번호는 필수 입력 항목입니다.'))
    );

    const result = await updateOrderDeliveryAction({
      orderId: 'order-1',
      targetStatus: 'SHIPPING',
      trackingCompany: 'CJ대한통운',
      trackingNumber: '',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('송장 번호는 필수');
  });
});



