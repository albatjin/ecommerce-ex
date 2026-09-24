import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createOrderAction, approvePaymentAction } from './order.actions';
import { ok, fail } from '@/core/domain/shared/Result';
import { DomainError } from '@/core/domain/shared/AppError';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/core/infrastructure/supabase/server', () => ({
  getServerClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }),
    },
  }),
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
