import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApproveReturnUseCase } from './ApproveReturnUseCase';
import { RejectReturnUseCase } from './RejectReturnUseCase';
import { GetAdminOrdersUseCase } from './GetAdminOrdersUseCase';
import { Order } from '@/core/domain/order/entities/Order';
import { OrderItem } from '@/core/domain/order/entities/OrderItem';
import { OrderNumber } from '@/core/domain/order/value-objects/OrderNumber';
import { ShippingAddress } from '@/core/domain/order/value-objects/ShippingAddress';
import { PaymentInfo } from '@/core/domain/order/value-objects/PaymentInfo';
import { Money } from '@/core/domain/catalog/value-objects/Money';
import { Product } from '@/core/domain/catalog/entities/Product';
import { Stock } from '@/core/domain/catalog/value-objects/Stock';
import { Discount } from '@/core/domain/catalog/value-objects/Discount';
import type { IOrderRepository } from '@/core/domain/order/repositories/IOrderRepository';
import type { IPaymentGateway } from '@/core/domain/order/gateways/IPaymentGateway';
import type { IProductRepository } from '@/core/domain/catalog/repositories/IProductRepository';
import type { IPointRepository } from '@/core/domain/promotion/repositories/IPointRepository';
import { ok, fail } from '@/core/domain/shared/Result';
import { DomainError } from '@/core/domain/shared/AppError';
import type { OrderStatus } from '@/shared/types/database.types';

describe('Admin Claims UseCases (Stage 30)', () => {
  let mockOrderRepo: IOrderRepository;
  let mockPaymentGateway: IPaymentGateway;
  let mockProductRepo: IProductRepository;
  let mockPointRepo: IPointRepository;

  const createSampleOrder = (options: {
    status?: OrderStatus;
    totalAmount?: number;
    pointUsed?: number;
  } = {}) => {
    const item = OrderItem.create({
      productId: 'prod-1',
      productName: '프리미엄 캐시미어 니트',
      unitPrice: Money.create(50000),
      quantity: 2,
      discountAmount: Money.zero(),
    }, 'item-1').getValue();

    const shipping = ShippingAddress.create({
      recipientName: '홍길동',
      recipientPhone: '010-1234-5678',
      address: '서울시 강남구 테헤란로 123',
      zipcode: '06234',
    }).getValue();

    const payment = PaymentInfo.create({
      method: 'CREDIT_CARD',
      status: 'COMPLETED',
      details: { transactionId: 'TX_12345' },
      paidAt: new Date(),
    }).getValue();

    return Order.create(
      {
        orderNumber: OrderNumber.create('ORD-20260924-00101').getValue(),
        customerId: 'user-1',
        orderName: '프리미엄 캐시미어 니트 2개',
        items: [item],
        status: options.status ?? 'RETURN_REQUESTED',
        totalProductAmount: Money.create(100000),
        discountAmount: Money.create(5000),
        pointUsed: Money.create(options.pointUsed ?? 5000),
        shippingFee: Money.create(3000),
        paymentInfo: payment,
        shippingAddress: shipping,
      },
      'order-101'
    ).getValue();
  };

  const createSampleProduct = (quantity = 10) => {
    return Product.create(
      {
        productCode: 'PROD-001',
        nameKo: '프리미엄 캐시미어 니트',
        nameEn: 'Premium Knit',
        categoryId: 'cat-1',
        discount: Discount.create(Money.create(60000), Money.create(50000)),
        stock: Stock.create(quantity, 2),
        taxType: 'TAXABLE',
        shippingFee: Money.create(3000),
        status: 'ACTIVE',
        maxOrderQuantity: 10,
        additionalImages: [],
      },
      'prod-1'
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
      refundPayment: vi.fn().mockResolvedValue(
        ok({
          refundId: 'REF_CLAIM_123',
          refundedAt: new Date(),
          amount: 93000,
          rawDetails: {},
        })
      ),
    };

    mockProductRepo = {
      findById: vi.fn().mockResolvedValue(createSampleProduct(10)),
      findByProductCode: vi.fn(),
      findMany: vi.fn(),
      save: vi.fn(),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn(),
    };

    mockPointRepo = {
      getCurrentBalance: vi.fn().mockResolvedValue(10000),
      recordTransaction: vi.fn().mockResolvedValue(undefined),
      findByCustomerId: vi.fn(),
    };
  });

  describe('ApproveReturnUseCase', () => {
    it('반품 요청(RETURN_REQUESTED) 상태의 주문을 승인하면 PG 환불, 재고 복원, 적립금 반환 및 RETURNED 상태 전이가 수행된다', async () => {
      const order = createSampleOrder({ status: 'RETURN_REQUESTED', pointUsed: 5000 });
      vi.mocked(mockOrderRepo.findById).mockResolvedValue(order);

      const useCase = new ApproveReturnUseCase(
        mockOrderRepo,
        mockPaymentGateway,
        mockProductRepo,
        mockPointRepo
      );

      const result = await useCase.execute({
        orderId: 'order-101',
        adminNote: '검수 완료 후 반품 승인',
      });

      expect(result.isSuccess).toBe(true);
      const output = result.getValue();
      expect(output.status).toBe('RETURNED');
      expect(output.refundedAmount).toBe(93000);
      expect(output.refundedPoints).toBe(5000);
      expect(output.refundTransactionId).toBe('REF_CLAIM_123');

      expect(mockPaymentGateway.refundPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: 'order-101',
          orderNumber: 'ORD-20260924-00101',
          amount: 93000,
        })
      );
      expect(mockProductRepo.update).toHaveBeenCalledTimes(1);
      expect(mockPointRepo.recordTransaction).toHaveBeenCalledTimes(1);
      expect(mockOrderRepo.save).toHaveBeenCalledWith(order);
    });

    it('반품 요청(RETURN_REQUESTED) 상태가 아닌 주문(예: DELIVERED)에 대해 승인을 시도하면 실패한다', async () => {
      const order = createSampleOrder({ status: 'DELIVERED' });
      vi.mocked(mockOrderRepo.findById).mockResolvedValue(order);

      const useCase = new ApproveReturnUseCase(
        mockOrderRepo,
        mockPaymentGateway,
        mockProductRepo,
        mockPointRepo
      );

      const result = await useCase.execute({
        orderId: 'order-101',
      });

      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain("반품 요청('RETURN_REQUESTED') 상태의 주문만");
      expect(mockPaymentGateway.refundPayment).not.toHaveBeenCalled();
      expect(mockOrderRepo.save).not.toHaveBeenCalled();
    });

    it('PG사 환불 통신 실패 시 반품 승인이 중단되고 에러를 반환한다', async () => {
      const order = createSampleOrder({ status: 'RETURN_REQUESTED' });
      vi.mocked(mockOrderRepo.findById).mockResolvedValue(order);

      vi.mocked(mockPaymentGateway.refundPayment).mockResolvedValueOnce(
        fail(new DomainError('PG사 네트워크 타임아웃'))
      );

      const useCase = new ApproveReturnUseCase(
        mockOrderRepo,
        mockPaymentGateway,
        mockProductRepo,
        mockPointRepo
      );

      const result = await useCase.execute({
        orderId: 'order-101',
      });

      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('PG사 결제 환불 실패');
      expect(mockOrderRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('RejectReturnUseCase', () => {
    it('반품 요청(RETURN_REQUESTED) 상태의 주문을 반려하면 사유 기록과 함께 DELIVERED 상태로 복귀한다', async () => {
      const order = createSampleOrder({ status: 'RETURN_REQUESTED' });
      vi.mocked(mockOrderRepo.findById).mockResolvedValue(order);

      const useCase = new RejectReturnUseCase(mockOrderRepo);

      const result = await useCase.execute({
        orderId: 'order-101',
        reason: '고객 부주의로 인한 상품 훼손 (태그 분실)',
      });

      expect(result.isSuccess).toBe(true);
      const output = result.getValue();
      expect(output.status).toBe('DELIVERED');
      expect(output.rejectionReason).toBe('고객 부주의로 인한 상품 훼손 (태그 분실)');
      expect(mockOrderRepo.save).toHaveBeenCalledWith(order);
    });

    it('반품 반려 사유를 입력하지 않으면 유효성 검증 오류로 실패한다', async () => {
      const order = createSampleOrder({ status: 'RETURN_REQUESTED' });
      vi.mocked(mockOrderRepo.findById).mockResolvedValue(order);

      const useCase = new RejectReturnUseCase(mockOrderRepo);

      const result = await useCase.execute({
        orderId: 'order-101',
        reason: '   ',
      });

      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('반품 반려 사유는 필수 입력 사항입니다');
      expect(mockOrderRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('GetAdminOrdersUseCase', () => {
    it('클레임 전체(CLAIMS_ALL) 필터로 조회 시 클레임 관련 상태들만 조회한다', async () => {
      const order = createSampleOrder({ status: 'RETURN_REQUESTED' });
      vi.mocked(mockOrderRepo.findMany).mockResolvedValue({
        orders: [order],
        totalCount: 1,
      });

      const useCase = new GetAdminOrdersUseCase(mockOrderRepo);

      const result = await useCase.execute({
        filterType: 'CLAIMS_ALL',
        limit: 10,
      });

      expect(result.isSuccess).toBe(true);
      expect(mockOrderRepo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          statuses: ['CANCEL_REQUESTED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURNED'],
          limit: 10,
        })
      );
      expect(result.getValue().orders.length).toBe(1);
      expect(result.getValue().orders[0].statusLabel).toBe('반품 요청');
    });
  });
});
