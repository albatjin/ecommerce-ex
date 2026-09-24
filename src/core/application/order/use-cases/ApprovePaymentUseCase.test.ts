import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApprovePaymentUseCase } from './ApprovePaymentUseCase';
import { Order } from '@/core/domain/order/entities/Order';
import { OrderItem } from '@/core/domain/order/entities/OrderItem';
import { OrderNumber } from '@/core/domain/order/value-objects/OrderNumber';
import { ShippingAddress } from '@/core/domain/order/value-objects/ShippingAddress';
import { PaymentInfo } from '@/core/domain/order/value-objects/PaymentInfo';
import { Money } from '@/core/domain/catalog/value-objects/Money';
import { Product } from '@/core/domain/catalog/entities/Product';
import { Stock } from '@/core/domain/catalog/value-objects/Stock';
import { Discount } from '@/core/domain/catalog/value-objects/Discount';
import { ok, fail } from '@/core/domain/shared/Result';
import { DomainError } from '@/core/domain/shared/AppError';
import type { IOrderRepository } from '@/core/domain/order/repositories/IOrderRepository';
import type { IPaymentGateway } from '@/core/domain/order/gateways/IPaymentGateway';
import type { IProductRepository } from '@/core/domain/catalog/repositories/IProductRepository';
import type { IPointRepository } from '@/core/domain/promotion/repositories/IPointRepository';

describe('ApprovePaymentUseCase', () => {
  let mockOrderRepo: IOrderRepository;
  let mockPaymentGateway: IPaymentGateway;
  let mockProductRepo: IProductRepository;
  let mockPointRepo: IPointRepository;

  const createSampleOrder = (status: any = 'PAYMENT_PENDING', pointUsed = 0) => {
    const item = OrderItem.create({
      productId: 'prod-1',
      productName: '프리미엄 셔츠',
      unitPrice: Money.create(50000),
      quantity: 2,
      discountAmount: Money.zero(),
    }).getValue();

    return Order.create(
      {
        orderNumber: OrderNumber.create('ORD-20260924-00001').getValue(),
        customerId: 'user-1',
        orderName: '프리미엄 셔츠',
        items: [item],
        status,
        totalProductAmount: Money.create(100000),
        discountAmount: Money.zero(),
        pointUsed: Money.create(pointUsed),
        shippingFee: Money.zero(),
        paymentInfo: PaymentInfo.createPending('CREDIT_CARD'),
        shippingAddress: ShippingAddress.create({
          recipientName: '홍길동',
          recipientPhone: '010-1234-5678',
          address: '서울시 강남구',
          zipcode: '06234',
        }).getValue(),
      },
      'order-1'
    ).getValue();
  };

  beforeEach(() => {
    mockOrderRepo = {
      findById: vi.fn(),
      findByOrderNumber: vi.fn(),
      findMany: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
      nextOrderNumber: vi.fn(),
    };

    mockPaymentGateway = {
      requestPayment: vi.fn(),
      refundPayment: vi.fn(),
    };

    mockProductRepo = {
      findById: vi.fn(),
      findByProductCode: vi.fn(),
      findMany: vi.fn(),
      save: vi.fn(),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn(),
    };

    mockPointRepo = {
      findByCustomerId: vi.fn(),
      getCurrentBalance: vi.fn().mockResolvedValue(5000),
      recordTransaction: vi.fn().mockResolvedValue(undefined),
    };
  });

  it('주문이 존재하지 않으면 실패한다', async () => {
    vi.mocked(mockOrderRepo.findById).mockResolvedValue(null);

    const useCase = new ApprovePaymentUseCase(mockOrderRepo, mockPaymentGateway);
    const result = await useCase.execute({ orderId: 'not-exist' });

    expect(result.isFailure).toBe(true);
    expect(result.getError().message).toContain('주문을 찾을 수 없습니다');
  });

  it('주문 상태가 PAYMENT_PENDING이 아니면 실패한다', async () => {
    const order = createSampleOrder('PAID');
    vi.mocked(mockOrderRepo.findById).mockResolvedValue(order);

    const useCase = new ApprovePaymentUseCase(mockOrderRepo, mockPaymentGateway);
    const result = await useCase.execute({ orderId: 'order-1' });

    expect(result.isFailure).toBe(true);
    expect(result.getError().message).toContain('결제 대기');
  });

  it('PG 결제 승인 성공 시 주문 상태가 PAID로 변경되고 저장된다', async () => {
    const order = createSampleOrder('PAYMENT_PENDING');
    vi.mocked(mockOrderRepo.findById).mockResolvedValue(order);

    const approvedAt = new Date();
    vi.mocked(mockPaymentGateway.requestPayment).mockResolvedValue(
      ok({
        transactionId: 'PG_TX_123456',
        approvedAt,
        amount: 100000,
        paymentMethod: 'CREDIT_CARD',
        rawDetails: { authCode: 'AUTH_999' },
      })
    );

    const useCase = new ApprovePaymentUseCase(
      mockOrderRepo,
      mockPaymentGateway,
      mockProductRepo,
      mockPointRepo
    );

    const result = await useCase.execute({ orderId: 'order-1' });

    expect(result.isSuccess).toBe(true);
    const data = result.getValue();
    expect(data.status).toBe('PAID');
    expect(data.transactionId).toBe('PG_TX_123456');
    expect(order.status).toBe('PAID');
    expect(order.paymentInfo.isCompleted()).toBe(true);
    expect(mockOrderRepo.save).toHaveBeenCalledWith(order);
  });

  it('PG 결제 실패 시 재고 복구, 적립금 환불 및 주문 취소(CANCELLED)가 수행된다', async () => {
    const order = createSampleOrder('PAYMENT_PENDING', 5000);
    vi.mocked(mockOrderRepo.findById).mockResolvedValue(order);

    // 상품 모의
    const product = Product.create({
      productCode: 'PROD-1',
      nameKo: '프리미엄 셔츠',
      discount: Discount.create(Money.create(50000), Money.create(50000)),
      taxType: 'TAXABLE',
      maxOrderQuantity: 10,
      stock: Stock.create(8), // 주문 시 2개 차감되어 8개 남았다고 가정
      shippingFee: Money.zero(),
      additionalImages: [],
    }).getValue();
    vi.mocked(mockProductRepo.findById).mockResolvedValue(product);

    // PG 실패 모의
    vi.mocked(mockPaymentGateway.requestPayment).mockResolvedValue(
      fail(new DomainError('카드 한도 초과로 승인 거절'))
    );

    const useCase = new ApprovePaymentUseCase(
      mockOrderRepo,
      mockPaymentGateway,
      mockProductRepo,
      mockPointRepo
    );

    const result = await useCase.execute({ orderId: 'order-1' });

    expect(result.isFailure).toBe(true);
    expect(result.getError().message).toContain('카드 한도 초과');

    // 1. 재고 2개 복구 (8 + 2 = 10)
    expect(product.stock.quantity).toBe(10);
    expect(mockProductRepo.update).toHaveBeenCalledWith(product);

    // 2. 적립금 5,000원 환불 원장 기록
    expect(mockPointRepo.recordTransaction).toHaveBeenCalledTimes(1);

    // 3. 주문 취소 및 저장
    expect(order.status).toBe('CANCELLED');
    expect(mockOrderRepo.save).toHaveBeenCalledWith(order);
  });
});

