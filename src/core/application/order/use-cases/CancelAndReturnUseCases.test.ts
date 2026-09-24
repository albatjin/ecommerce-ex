import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CancelOrderUseCase } from './CancelOrderUseCase';
import { RequestReturnUseCase } from './RequestReturnUseCase';
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
import type { OrderStatus } from '@/shared/types/database.types';

describe('CancelOrderUseCase & RequestReturnUseCase (Stage 28)', () => {
  let mockOrderRepo: IOrderRepository;
  let mockPaymentGateway: IPaymentGateway;
  let mockProductRepo: IProductRepository;
  let mockPointRepo: IPointRepository;

  const createSampleOrder = (options: {
    status?: OrderStatus;
    pointUsed?: number;
    customerId?: string;
    isPaid?: boolean;
  } = {}) => {
    const {
      status = 'PAID',
      pointUsed = 5000,
      customerId = 'user-1',
      isPaid = true,
    } = options;

    const item = OrderItem.create({
      productId: 'prod-1',
      productName: '프리미엄 캐시미어 니트',
      unitPrice: Money.create(50000),
      quantity: 2,
      discountAmount: Money.zero(),
    }).getValue();

    const paymentInfo = isPaid
      ? PaymentInfo.create({
          method: 'CREDIT_CARD',
          status: 'COMPLETED',
          details: { transactionId: 'TX_12345' },
          paidAt: new Date(),
        }).getValue()
      : PaymentInfo.createPending('CREDIT_CARD');

    return Order.create(
      {
        orderNumber: OrderNumber.create('ORD-20260925-00001').getValue(),
        customerId,
        orderName: '프리미엄 캐시미어 니트 외 1건',
        items: [item],
        status,
        totalProductAmount: Money.create(100000),
        discountAmount: Money.zero(),
        pointUsed: Money.create(pointUsed),
        shippingFee: Money.create(3000),
        paymentInfo,
        shippingAddress: ShippingAddress.create({
          recipientName: '홍길동',
          recipientPhone: '010-1234-5678',
          address: '서울시 강남구 테헤란로 123',
          zipcode: '06234',
        }).getValue(),
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
          refundId: 'REF_99999',
          refundedAt: new Date(),
          amount: 98000,
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

  describe('CancelOrderUseCase', () => {
    it('결제 완료(PAID) 상태의 주문을 취소하면 PG 환불, 재고 복원, 적립금 반환이 정상 수행된다', async () => {
      const order = createSampleOrder({ status: 'PAID', isPaid: true, pointUsed: 5000 });
      vi.mocked(mockOrderRepo.findById).mockResolvedValue(order);

      const useCase = new CancelOrderUseCase(
        mockOrderRepo,
        mockPaymentGateway,
        mockProductRepo,
        mockPointRepo
      );

      const result = await useCase.execute({
        orderId: 'order-101',
        customerId: 'user-1',
        reason: '단순 변심',
      });

      expect(result.isSuccess).toBe(true);
      const data = result.getValue();
      expect(data.status).toBe('CANCELLED');
      expect(data.refundTransactionId).toBe('REF_99999');

      // 1. PG 환불 호출 검증
      expect(mockPaymentGateway.refundPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: 'order-101',
          amount: 98000, // 100,000 - 5,000 + 3,000 = 98,000
          reason: '단순 변심',
        })
      );

      // 2. 재고 복구 검증 (2개 수량 restock)
      expect(mockProductRepo.update).toHaveBeenCalledTimes(1);

      // 3. 적립금 5,000원 반환 원장 기록 검증
      expect(mockPointRepo.recordTransaction).toHaveBeenCalledTimes(1);

      // 4. 주문 정보 저장 검증
      expect(mockOrderRepo.save).toHaveBeenCalledTimes(1);
    });

    it('결제 대기(PAYMENT_PENDING) 상태의 주문을 취소하면 PG 환불 없이 재고만 복구되고 취소된다', async () => {
      const order = createSampleOrder({ status: 'PAYMENT_PENDING', isPaid: false, pointUsed: 0 });
      vi.mocked(mockOrderRepo.findById).mockResolvedValue(order);

      const useCase = new CancelOrderUseCase(
        mockOrderRepo,
        mockPaymentGateway,
        mockProductRepo,
        mockPointRepo
      );

      const result = await useCase.execute({
        orderId: 'order-101',
        customerId: 'user-1',
      });

      expect(result.isSuccess).toBe(true);
      expect(mockPaymentGateway.refundPayment).not.toHaveBeenCalled();
      expect(mockProductRepo.update).toHaveBeenCalledTimes(1);
      expect(mockOrderRepo.save).toHaveBeenCalledTimes(1);
    });

    it('배송 중(SHIPPING)이거나 배송 완료(DELIVERED)인 주문은 취소할 수 없고 실패한다', async () => {
      const order = createSampleOrder({ status: 'SHIPPING', isPaid: true });
      vi.mocked(mockOrderRepo.findById).mockResolvedValue(order);

      const useCase = new CancelOrderUseCase(
        mockOrderRepo,
        mockPaymentGateway,
        mockProductRepo,
        mockPointRepo
      );

      const result = await useCase.execute({
        orderId: 'order-101',
        customerId: 'user-1',
      });

      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('즉시 취소할 수 없습니다');
      expect(mockPaymentGateway.refundPayment).not.toHaveBeenCalled();
      expect(mockOrderRepo.save).not.toHaveBeenCalled();
    });

    it('다른 고객의 주문을 취소하려고 시도하면 권한 오류로 실패한다', async () => {
      const order = createSampleOrder({ status: 'PAID', customerId: 'user-1' });
      vi.mocked(mockOrderRepo.findById).mockResolvedValue(order);

      const useCase = new CancelOrderUseCase(
        mockOrderRepo,
        mockPaymentGateway,
        mockProductRepo,
        mockPointRepo
      );

      const result = await useCase.execute({
        orderId: 'order-101',
        customerId: 'other-user',
      });

      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toBe('본인의 주문만 취소할 수 있습니다.');
    });

    it('PG 환불 처리에서 실패하면 주문이 취소되지 않고 에러를 반환한다', async () => {
      const order = createSampleOrder({ status: 'PAID', isPaid: true });
      vi.mocked(mockOrderRepo.findById).mockResolvedValue(order);
      vi.mocked(mockPaymentGateway.refundPayment).mockResolvedValue(
        fail(new DomainError('카드사 취소 시스템 장애'))
      );

      const useCase = new CancelOrderUseCase(
        mockOrderRepo,
        mockPaymentGateway,
        mockProductRepo,
        mockPointRepo
      );

      const result = await useCase.execute({
        orderId: 'order-101',
        customerId: 'user-1',
      });

      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('PG 결제 취소 실패');
      expect(mockOrderRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('RequestReturnUseCase', () => {
    it('배송 완료(DELIVERED) 상태인 주문에 대해 반품을 신청하면 RETURN_REQUESTED 상태로 전이된다', async () => {
      const order = createSampleOrder({ status: 'DELIVERED', isPaid: true });
      vi.mocked(mockOrderRepo.findById).mockResolvedValue(order);

      const useCase = new RequestReturnUseCase(mockOrderRepo);

      const result = await useCase.execute({
        orderId: 'order-101',
        customerId: 'user-1',
        reason: '사이즈 불일치',
        detailedReason: 'M 사이즈가 생각보다 작아서 교환/반품 희망합니다.',
      });

      expect(result.isSuccess).toBe(true);
      const data = result.getValue();
      expect(data.status).toBe('RETURN_REQUESTED');
      expect(data.reason).toBe('사이즈 불일치');
      expect(mockOrderRepo.save).toHaveBeenCalledTimes(1);
    });

    it('배송 완료(DELIVERED) 이전 상태(예: PAID)에서는 반품을 신청할 수 없다', async () => {
      const order = createSampleOrder({ status: 'PAID', isPaid: true });
      vi.mocked(mockOrderRepo.findById).mockResolvedValue(order);

      const useCase = new RequestReturnUseCase(mockOrderRepo);

      const result = await useCase.execute({
        orderId: 'order-101',
        customerId: 'user-1',
        reason: '단순 변심',
      });

      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('배송 완료(\'DELIVERED\') 상태의 주문만 반품을 신청할 수 있습니다.');
      expect(mockOrderRepo.save).not.toHaveBeenCalled();
    });

    it('반품 사유를 입력하지 않으면 유효성 검증 오류로 실패한다', async () => {
      const order = createSampleOrder({ status: 'DELIVERED', isPaid: true });
      vi.mocked(mockOrderRepo.findById).mockResolvedValue(order);

      const useCase = new RequestReturnUseCase(mockOrderRepo);

      const result = await useCase.execute({
        orderId: 'order-101',
        customerId: 'user-1',
        reason: '   ',
      });

      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toBe('반품 사유를 입력해 주세요.');
    });
  });
});
