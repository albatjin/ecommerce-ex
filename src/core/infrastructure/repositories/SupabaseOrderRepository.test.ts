import { describe, it, expect, vi } from 'vitest';
import { SupabaseOrderRepository } from './SupabaseOrderRepository';
import { Order } from '@/core/domain/order/entities/Order';
import { OrderItem } from '@/core/domain/order/entities/OrderItem';
import { OrderNumber } from '@/core/domain/order/value-objects/OrderNumber';
import { ShippingAddress } from '@/core/domain/order/value-objects/ShippingAddress';
import { PaymentInfo } from '@/core/domain/order/value-objects/PaymentInfo';
import { Money } from '@/core/domain/catalog/value-objects/Money';
import type { Database } from '@/shared/types/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';

describe('SupabaseOrderRepository', () => {
  const sampleOrderWithItems = {
    id: 'order-1',
    order_number: 'ORD-20260924-TEST1',
    customer_id: 'user-1',
    order_name: '테스트 상품 외 0건',
    status: 'PAYMENT_PENDING' as const,
    total_product_amount: 30000,
    discount_amount: 0,
    point_used: 0,
    shipping_fee: 3000,
    total_paid_amount: 33000,
    payment_method: 'CREDIT_CARD' as const,
    payment_status: 'PENDING' as const,
    payment_details: null,
    recipient_name: '홍길동',
    recipient_phone: '010-1234-5678',
    shipping_address: '서울시',
    shipping_zipcode: '01234',
    shipping_message: null,
    tracking_company: null,
    tracking_number: null,
    paid_at: null,
    shipped_at: null,
    delivered_at: null,
    cancelled_at: null,
    created_at: '2026-09-24T10:00:00.000Z',
    updated_at: '2026-09-24T10:00:00.000Z',
    order_items: [
      {
        id: 'item-1',
        order_id: 'order-1',
        product_id: 'prod-1',
        variant_id: null,
        product_name: '테스트 상품',
        variant_name: null,
        product_image_url: null,
        sku_code: null,
        unit_price: 30000,
        quantity: 1,
        discount_amount: 0,
        total_price: 30000,
        status: 'ORDERED' as const,
        created_at: '2026-09-24T10:00:00.000Z',
      },
    ],
  };

  it('findById: 주문 ID로 품목이 포함된 Order Aggregate Root를 조회한다', async () => {
    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: sampleOrderWithItems,
              error: null,
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient<Database>;

    const repo = new SupabaseOrderRepository(mockClient);
    const order = await repo.findById('order-1');

    expect(order).not.toBeNull();
    expect(order?.id).toBe('order-1');
    expect(order?.orderNumber.value).toBe('ORD-20260924-TEST1');
    expect(order?.items).toHaveLength(1);
    expect(order?.items[0].productName).toBe('테스트 상품');
  });

  it('findByOrderNumber: 주문 번호로 주문을 조회한다', async () => {
    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: sampleOrderWithItems,
              error: null,
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient<Database>;

    const repo = new SupabaseOrderRepository(mockClient);
    const order = await repo.findByOrderNumber('ORD-20260924-TEST1');

    expect(order).not.toBeNull();
    expect(order?.orderNumber.value).toBe('ORD-20260924-TEST1');
  });

  it('findMany: 고객 ID 및 상태 필터 기반으로 주문 목록을 조회한다', async () => {
    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: [sampleOrderWithItems],
                error: null,
                count: 1,
              }),
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient<Database>;

    const repo = new SupabaseOrderRepository(mockClient);
    const { orders, totalCount } = await repo.findMany({ customerId: 'user-1' });

    expect(orders).toHaveLength(1);
    expect(totalCount).toBe(1);
  });

  it('save: orders 및 order_items 테이블에 주문 데이터를 upsert 저장한다', async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null });
    const mockClient = {
      from: vi.fn(() => ({
        upsert: upsertMock,
      })),
    } as unknown as SupabaseClient<Database>;

    const repo = new SupabaseOrderRepository(mockClient);
    const item = OrderItem.create({
      productName: '단품',
      unitPrice: Money.create(10000),
      quantity: 1,
      discountAmount: Money.zero(),
    }).getValue();

    const order = Order.create({
      orderNumber: OrderNumber.generate(),
      orderName: '단품 1건',
      items: [item],
      status: 'PAYMENT_PENDING',
      totalProductAmount: Money.create(10000),
      discountAmount: Money.zero(),
      pointUsed: Money.zero(),
      shippingFee: Money.create(3000),
      paymentInfo: PaymentInfo.createPending('CREDIT_CARD'),
      shippingAddress: ShippingAddress.create({
        recipientName: '테스터',
        recipientPhone: '010-0000-0000',
        address: '주소',
        zipcode: '00000',
      }).getValue(),
    }).getValue();

    await repo.save(order);

    // orders upsert 1회 + order_items upsert 1회
    expect(upsertMock).toHaveBeenCalledTimes(2);
  });

  it('nextOrderNumber: 중복되지 않는 새로운 주문 번호를 생성한다', async () => {
    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    } as unknown as SupabaseClient<Database>;

    const repo = new SupabaseOrderRepository(mockClient);
    const orderNumber = await repo.nextOrderNumber();

    expect(orderNumber.value).toMatch(/^ORD-\d{8}-[A-Z0-9]{5}$/);
  });
});
