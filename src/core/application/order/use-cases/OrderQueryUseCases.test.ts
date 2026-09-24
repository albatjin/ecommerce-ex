import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetOrderUseCase } from './GetOrderUseCase';
import { GetUserOrdersUseCase } from './GetUserOrdersUseCase';
import { Order } from '@/core/domain/order/entities/Order';
import { OrderItem } from '@/core/domain/order/entities/OrderItem';
import { OrderNumber } from '@/core/domain/order/value-objects/OrderNumber';
import { ShippingAddress } from '@/core/domain/order/value-objects/ShippingAddress';
import { PaymentInfo } from '@/core/domain/order/value-objects/PaymentInfo';
import { Money } from '@/core/domain/catalog/value-objects/Money';
import type { IOrderRepository } from '@/core/domain/order/repositories/IOrderRepository';

describe('Order Query UseCases', () => {
  let mockOrderRepo: IOrderRepository;

  const createSampleOrder = (id: string, orderNumStr: string, customerId = 'user-1') => {
    const item = OrderItem.create({
      productId: 'prod-1',
      productName: '캐시미어 니트',
      unitPrice: Money.create(80000),
      quantity: 1,
      discountAmount: Money.zero(),
    }).getValue();

    return Order.create(
      {
        orderNumber: OrderNumber.create(orderNumStr).getValue(),
        customerId,
        orderName: '캐시미어 니트',
        items: [item],
        status: 'PAID',
        totalProductAmount: Money.create(80000),
        discountAmount: Money.zero(),
        pointUsed: Money.zero(),
        shippingFee: Money.zero(),
        paymentInfo: PaymentInfo.createPending('CREDIT_CARD').markAsCompleted(),
        shippingAddress: ShippingAddress.create({
          recipientName: '홍길동',
          recipientPhone: '010-1234-5678',
          address: '서울시 강남구 테헤란로',
          zipcode: '06234',
        }).getValue(),
      },
      id
    ).getValue();
  };

  beforeEach(() => {
    mockOrderRepo = {
      findById: vi.fn(),
      findByOrderNumber: vi.fn(),
      findMany: vi.fn(),
      save: vi.fn(),
      nextOrderNumber: vi.fn(),
    };
  });

  describe('GetOrderUseCase', () => {
    it('주문 ID 또는 번호가 모두 주어지지 않으면 실패한다', async () => {
      const useCase = new GetOrderUseCase(mockOrderRepo);
      const result = await useCase.execute({});

      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('주문 ID 또는 주문 번호');
    });

    it('주문 번호로 단건 상세 조회가 정상 수행된다', async () => {
      const order = createSampleOrder('order-1', 'ORD-20260924-00001');
      vi.mocked(mockOrderRepo.findByOrderNumber).mockResolvedValue(order);

      const useCase = new GetOrderUseCase(mockOrderRepo);
      const result = await useCase.execute({ orderNumber: 'ORD-20260924-00001' });

      expect(result.isSuccess).toBe(true);
      const dto = result.getValue();
      expect(dto.orderNumber).toBe('ORD-20260924-00001');
      expect(dto.statusLabel).toBe('결제 완료');
      expect(dto.items.length).toBe(1);
      expect(dto.items[0].productName).toBe('캐시미어 니트');
    });

    it('타인의 주문을 조회하려 할 경우 권한 에러를 반환한다', async () => {
      const order = createSampleOrder('order-1', 'ORD-20260924-00001', 'user-1');
      vi.mocked(mockOrderRepo.findById).mockResolvedValue(order);

      const useCase = new GetOrderUseCase(mockOrderRepo);
      const result = await useCase.execute({
        orderId: 'order-1',
        customerId: 'different-user',
      });

      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('조회 권한이 없습니다');
    });
  });

  describe('GetUserOrdersUseCase', () => {
    it('고객 식별자가 비어있으면 실패한다', async () => {
      const useCase = new GetUserOrdersUseCase(mockOrderRepo);
      const result = await useCase.execute({ customerId: '' });

      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('고객 식별자');
    });

    it('고객의 주문 목록과 총 건수를 정상 반환한다', async () => {
      const order1 = createSampleOrder('order-1', 'ORD-20260924-00001', 'user-1');
      const order2 = createSampleOrder('order-2', 'ORD-20260924-00002', 'user-1');
      vi.mocked(mockOrderRepo.findMany).mockResolvedValue({
        orders: [order1, order2],
        totalCount: 2,
      });

      const useCase = new GetUserOrdersUseCase(mockOrderRepo);
      const result = await useCase.execute({ customerId: 'user-1' });

      expect(result.isSuccess).toBe(true);
      const data = result.getValue();
      expect(data.totalCount).toBe(2);
      expect(data.orders.length).toBe(2);
      expect(data.orders[0].orderNumber).toBe('ORD-20260924-00001');
      expect(data.orders[1].orderNumber).toBe('ORD-20260924-00002');
    });
  });
});

