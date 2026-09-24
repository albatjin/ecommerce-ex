import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateOrderUseCase } from './CreateOrderUseCase';
import { Product } from '@/core/domain/catalog/entities/Product';
import { Discount } from '@/core/domain/catalog/value-objects/Discount';
import { Stock } from '@/core/domain/catalog/value-objects/Stock';
import { Money } from '@/core/domain/catalog/value-objects/Money';
import { OrderNumber } from '@/core/domain/order/value-objects/OrderNumber';
import { CustomerCoupon } from '@/core/domain/promotion/entities/CustomerCoupon';
import { Cart } from '@/core/domain/cart/entities/Cart';
import { CartItem } from '@/core/domain/cart/entities/CartItem';
import type { IOrderRepository } from '@/core/domain/order/repositories/IOrderRepository';
import type { IProductRepository } from '@/core/domain/catalog/repositories/IProductRepository';
import type { ICouponRepository } from '@/core/domain/promotion/repositories/ICouponRepository';
import type { IPointRepository } from '@/core/domain/promotion/repositories/IPointRepository';
import type { ICartRepository } from '@/core/domain/cart/repositories/ICartRepository';

describe('CreateOrderUseCase', () => {
  let mockOrderRepo: IOrderRepository;
  let mockProductRepo: IProductRepository;
  let mockCouponRepo: ICouponRepository;
  let mockPointRepo: IPointRepository;
  let mockCartRepo: ICartRepository;

  const createSampleProduct = (id: string, nameKo: string, price: number, stockQty: number, status: any = 'ACTIVE') => {
    return Product.create(
      {
        productCode: `PROD-${id}`,
        nameKo,
        discount: Discount.create(Money.create(price), Money.create(price)),
        taxType: 'TAXABLE',
        maxOrderQuantity: 10,
        stock: Stock.create(stockQty),
        status,
        shippingFee: Money.create(3000),
        additionalImages: [],
      },
      id
    ).getValue();
  };

  const validShipping = {
    recipientName: '홍길동',
    recipientPhone: '010-1234-5678',
    address: '서울특별시 강남구 테헤란로 123',
    zipcode: '06234',
    message: '문 앞에 놓아주세요',
  };

  beforeEach(() => {
    mockOrderRepo = {
      findById: vi.fn(),
      findByOrderNumber: vi.fn(),
      findMany: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
      nextOrderNumber: vi.fn().mockResolvedValue(OrderNumber.create('ORD-20260924-00001').getValue()),
    };

    mockProductRepo = {
      findById: vi.fn(),
      findByProductCode: vi.fn(),
      findMany: vi.fn(),
      save: vi.fn(),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn(),
    };

    mockCouponRepo = {
      findAvailableByCustomerId: vi.fn(),
      findAllByCustomerId: vi.fn(),
      findById: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
      issueCoupon: vi.fn(),
    };

    mockPointRepo = {
      findByCustomerId: vi.fn(),
      getCurrentBalance: vi.fn().mockResolvedValue(10000),
      recordTransaction: vi.fn().mockResolvedValue(undefined),
    };

    mockCartRepo = {
      getCart: vi.fn().mockResolvedValue(Cart.create().getValue()),
      saveCart: vi.fn().mockResolvedValue(undefined),
      clearCart: vi.fn().mockResolvedValue(undefined),
    };
  });

  it('주문 품목이 없으면 실패한다', async () => {
    const useCase = new CreateOrderUseCase(mockOrderRepo, mockProductRepo);
    const result = await useCase.execute({
      items: [],
      shippingAddress: validShipping,
      paymentMethod: 'CREDIT_CARD',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError().message).toContain('주문할 상품이 없습니다');
  });

  it('배송지 연락처 형식이 유효하지 않으면 실패한다', async () => {
    const useCase = new CreateOrderUseCase(mockOrderRepo, mockProductRepo);
    const result = await useCase.execute({
      items: [{ productId: 'prod-1', quantity: 1 }],
      shippingAddress: { ...validShipping, recipientPhone: '123' },
      paymentMethod: 'CREDIT_CARD',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError().message).toContain('올바른 전화번호 형식');
  });

  it('상품이 존재하지 않으면 실패한다', async () => {
    vi.mocked(mockProductRepo.findById).mockResolvedValue(null);

    const useCase = new CreateOrderUseCase(mockOrderRepo, mockProductRepo);
    const result = await useCase.execute({
      items: [{ productId: 'not-exist', quantity: 1 }],
      shippingAddress: validShipping,
      paymentMethod: 'CREDIT_CARD',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError().message).toContain('상품을 찾을 수 없습니다');
  });

  it('상품 재고가 부족하면 실패한다', async () => {
    const product = createSampleProduct('prod-1', '테스트 상품', 20000, 2);
    vi.mocked(mockProductRepo.findById).mockResolvedValue(product);

    const useCase = new CreateOrderUseCase(mockOrderRepo, mockProductRepo);
    const result = await useCase.execute({
      items: [{ productId: 'prod-1', quantity: 5 }],
      shippingAddress: validShipping,
      paymentMethod: 'CREDIT_CARD',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError().message).toContain('재고가 부족합니다');
  });

  it('상품이 비활성(ACTIVE 아님) 상태이면 실패한다', async () => {
    const product = createSampleProduct('prod-1', '품절 상품', 20000, 10, 'OUT_OF_STOCK');
    vi.mocked(mockProductRepo.findById).mockResolvedValue(product);

    const useCase = new CreateOrderUseCase(mockOrderRepo, mockProductRepo);
    const result = await useCase.execute({
      items: [{ productId: 'prod-1', quantity: 1 }],
      shippingAddress: validShipping,
      paymentMethod: 'CREDIT_CARD',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError().message).toContain('구매할 수 없는 상태');
  });

  it('5만원 미만 주문 시 기본 배송비 3,000원이 부과되고 재고가 차감된다', async () => {
    const product = createSampleProduct('prod-1', '티셔츠', 25000, 10);
    vi.mocked(mockProductRepo.findById).mockResolvedValue(product);

    const useCase = new CreateOrderUseCase(
      mockOrderRepo,
      mockProductRepo,
      mockCouponRepo,
      mockPointRepo,
      mockCartRepo
    );

    const result = await useCase.execute({
      customerId: 'user-1',
      items: [{ productId: 'prod-1', quantity: 1 }],
      shippingAddress: validShipping,
      paymentMethod: 'CREDIT_CARD',
    });

    expect(result.isSuccess).toBe(true);
    const data = result.getValue();
    expect(data.totalProductAmount).toBe(25000);
    expect(data.shippingFee).toBe(3000);
    expect(data.totalPaidAmount).toBe(28000);
    expect(data.status).toBe('PAYMENT_PENDING');

    // 재고 차감 확인
    expect(product.stock.quantity).toBe(9);
    expect(mockProductRepo.update).toHaveBeenCalledWith(product);
    expect(mockOrderRepo.save).toHaveBeenCalledTimes(1);
  });

  it('5만원 이상 주문 시 무료배송이 적용된다', async () => {
    const product = createSampleProduct('prod-1', '고급 외투', 60000, 5);
    vi.mocked(mockProductRepo.findById).mockResolvedValue(product);

    const useCase = new CreateOrderUseCase(mockOrderRepo, mockProductRepo);
    const result = await useCase.execute({
      items: [{ productId: 'prod-1', quantity: 1 }],
      shippingAddress: validShipping,
      paymentMethod: 'NAVER_PAY',
    });

    expect(result.isSuccess).toBe(true);
    const data = result.getValue();
    expect(data.totalProductAmount).toBe(60000);
    expect(data.shippingFee).toBe(0);
    expect(data.totalPaidAmount).toBe(60000);
  });

  it('쿠폰 사용 시 할인이 정상 반영되고 쿠폰이 사용 처리된다', async () => {
    const product = createSampleProduct('prod-1', '청바지', 50000, 5);
    vi.mocked(mockProductRepo.findById).mockResolvedValue(product);

    const tomorrow = new Date(Date.now() + 86400000);
    const coupon = CustomerCoupon.create({
      customerId: 'user-1',
      name: '5천원 할인쿠폰',
      discountAmount: 5000,
      minOrderAmount: 30000,
      expiresAt: tomorrow,
    }).getValue();

    vi.mocked(mockCouponRepo.findById).mockResolvedValue(coupon);

    const useCase = new CreateOrderUseCase(
      mockOrderRepo,
      mockProductRepo,
      mockCouponRepo,
      mockPointRepo
    );

    const result = await useCase.execute({
      customerId: 'user-1',
      items: [{ productId: 'prod-1', quantity: 1 }],
      shippingAddress: validShipping,
      paymentMethod: 'KAKAO_PAY',
      couponId: coupon.id,
    });

    expect(result.isSuccess).toBe(true);
    const data = result.getValue();
    expect(data.discountAmount).toBe(5000);
    expect(data.totalPaidAmount).toBe(45000); // 50,000 - 5,000 + 0 shipping
    expect(coupon.isUsed).toBe(true);
    expect(mockCouponRepo.save).toHaveBeenCalledWith(coupon);
  });

  it('적립금 사용 시 보유 잔액 검증 후 차감 및 트랜잭션이 기록된다', async () => {
    const product = createSampleProduct('prod-1', '신발', 40000, 5);
    vi.mocked(mockProductRepo.findById).mockResolvedValue(product);
    vi.mocked(mockPointRepo.getCurrentBalance).mockResolvedValue(5000);

    const useCase = new CreateOrderUseCase(
      mockOrderRepo,
      mockProductRepo,
      undefined,
      mockPointRepo
    );

    const result = await useCase.execute({
      customerId: 'user-1',
      items: [{ productId: 'prod-1', quantity: 1 }],
      shippingAddress: validShipping,
      paymentMethod: 'TOSS_PAY',
      pointsToUse: 3000,
    });

    expect(result.isSuccess).toBe(true);
    const data = result.getValue();
    expect(data.totalProductAmount).toBe(40000);
    expect(data.shippingFee).toBe(3000);
    expect(data.pointUsed).toBe(3000);
    expect(data.totalPaidAmount).toBe(40000); // 40,000 + 3,000 - 3,000
    expect(mockPointRepo.recordTransaction).toHaveBeenCalledTimes(1);
  });

  it('보유 적립금 초과 사용 시 실패한다', async () => {
    const product = createSampleProduct('prod-1', '신발', 40000, 5);
    vi.mocked(mockProductRepo.findById).mockResolvedValue(product);
    vi.mocked(mockPointRepo.getCurrentBalance).mockResolvedValue(1000);

    const useCase = new CreateOrderUseCase(
      mockOrderRepo,
      mockProductRepo,
      undefined,
      mockPointRepo
    );

    const result = await useCase.execute({
      customerId: 'user-1',
      items: [{ productId: 'prod-1', quantity: 1 }],
      shippingAddress: validShipping,
      paymentMethod: 'TOSS_PAY',
      pointsToUse: 2000,
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError().message).toContain('보유 적립금(1,000원)을 초과');
  });

  it('장바구니 저장소가 주어지면 주문 완료 후 주문 품목이 장바구니에서 제거된다', async () => {
    const product = createSampleProduct('prod-1', '모자', 30000, 5);
    vi.mocked(mockProductRepo.findById).mockResolvedValue(product);

    const cart = Cart.create().getValue();
    const cartItem = CartItem.create({
      productId: 'prod-1',
      productName: '모자',
      price: Money.create(30000),
      quantity: 1,
      shippingFee: Money.create(3000),
    }).getValue();
    cart.addItem(cartItem);

    vi.mocked(mockCartRepo.getCart).mockResolvedValue(cart);

    const useCase = new CreateOrderUseCase(
      mockOrderRepo,
      mockProductRepo,
      undefined,
      undefined,
      mockCartRepo
    );

    const result = await useCase.execute({
      customerId: 'user-1',
      items: [{ productId: 'prod-1', quantity: 1 }],
      shippingAddress: validShipping,
      paymentMethod: 'CREDIT_CARD',
    });

    expect(result.isSuccess).toBe(true);
    expect(cart.items.length).toBe(0);
    expect(mockCartRepo.saveCart).toHaveBeenCalledWith(cart);
  });
});
