import { describe, it, expect, vi, beforeEach } from 'vitest';

// 1. Domain Entities & Value Objects
import { Product } from '@/core/domain/catalog/entities/Product';
import { Money } from '@/core/domain/catalog/value-objects/Money';
import { Stock } from '@/core/domain/catalog/value-objects/Stock';
import { Discount } from '@/core/domain/catalog/value-objects/Discount';
import { Category } from '@/core/domain/catalog/entities/Category';
import { Cart } from '@/core/domain/cart/entities/Cart';
import { CartItem } from '@/core/domain/cart/entities/CartItem';
import { Order } from '@/core/domain/order/entities/Order';
import { OrderNumber } from '@/core/domain/order/value-objects/OrderNumber';
import { StoreSettings } from '@/core/domain/settings/StoreSettings';
import { ok, type Result } from '@/core/domain/shared/Result';
import { DomainError } from '@/core/domain/shared/AppError';
import type {
  PaymentApprovalResult,
  PaymentRefundResult,
} from '@/core/domain/order/gateways/IPaymentGateway';

// 2. Application Use Cases
import { CreateOrderUseCase } from '@/core/application/order/use-cases/CreateOrderUseCase';
import { ApprovePaymentUseCase } from '@/core/application/order/use-cases/ApprovePaymentUseCase';
import { UpdateOrderDeliveryUseCase } from '@/core/application/order/use-cases/UpdateOrderDeliveryUseCase';
import { GetAdminOrdersUseCase } from '@/core/application/order/use-cases/GetAdminOrdersUseCase';
import { CreateCategoryUseCase } from '@/core/application/catalog/use-cases/CreateCategoryUseCase';
import { ReorderCategoriesUseCase } from '@/core/application/catalog/use-cases/ReorderCategoriesUseCase';
import { UpdateStoreSettingsUseCase } from '@/core/application/settings/use-cases/UpdateStoreSettingsUseCase';
import { RequestReturnUseCase } from '@/core/application/order/use-cases/RequestReturnUseCase';
import { ApproveReturnUseCase } from '@/core/application/order/use-cases/ApproveReturnUseCase';

// 3. Repositories Interfaces
import type { IOrderRepository } from '@/core/domain/order/repositories/IOrderRepository';
import type { IProductRepository } from '@/core/domain/catalog/repositories/IProductRepository';
import type { ICategoryRepository } from '@/core/domain/catalog/repositories/ICategoryRepository';
import type { IStoreSettingsRepository } from '@/core/domain/settings/IStoreSettingsRepository';
import type { IPaymentGateway } from '@/core/domain/order/gateways/IPaymentGateway';
import type { ICouponRepository } from '@/core/domain/promotion/repositories/ICouponRepository';
import type { IPointRepository } from '@/core/domain/promotion/repositories/IPointRepository';

describe('Full-Cycle E2E Integration: Catalog -> Cart -> Order -> Payment -> Admin Fulfillment -> CS & Claims', () => {
  // In-memory Mock Stores
  let productsStore: Map<string, Product>;
  let categoriesStore: Map<string, Category>;
  let ordersStore: Map<string, Order>;
  let settingsStore: StoreSettings;

  // Mock Repositories & Gateway
  let mockProductRepo: IProductRepository;
  let mockCategoryRepo: ICategoryRepository;
  let mockOrderRepo: IOrderRepository;
  let mockStoreSettingsRepo: IStoreSettingsRepository;
  let mockPaymentGateway: IPaymentGateway;
  let mockCouponRepo: ICouponRepository;
  let mockPointRepo: IPointRepository;

  beforeEach(() => {
    productsStore = new Map();
    categoriesStore = new Map();
    ordersStore = new Map();

    // 1. Initial Category setup
    const fashionCategory = Category.create(
      { name: '패션의류', slug: 'fashion', depth: 1, sortOrder: 1, isActive: true },
      'cat-fashion'
    ).getValue();
    categoriesStore.set('cat-fashion', fashionCategory);

    // 2. Initial Product setup
    const regular = Money.create(120000);
    const sale = Money.create(108000);
    const discount = Discount.create(regular, sale);
    const stock = Stock.create(50, 10);
    const shippingFee = Money.create(3000);

    const winterJacket = Product.create(
      {
        productCode: 'PROD-JACKET-1',
        nameKo: '프리미엄 윈터 다운 자켓',
        description: '최고급 구스다운 충전재가 적용된 보온 패딩 자켓',
        discount,
        taxType: 'TAXABLE',
        maxOrderQuantity: 10,
        stock,
        status: 'ACTIVE',
        categoryId: 'cat-fashion',
        additionalImages: ['https://example.com/jacket.jpg'],
        shippingFee,
      },
      'prod-jacket-1'
    ).getValue();
    productsStore.set('prod-jacket-1', winterJacket);

    // 3. Store Settings
    settingsStore = StoreSettings.create({
      storeName: 'CommerceHub 공식스토어',
      representativeName: '김은영',
      businessNumber: '214-88-91204',
      ecommercePermitNumber: '2024-서울강남-03891호',
      csPhone: '1588-4920',
      csEmail: 'support@commercehub.co.kr',
      address: '서울특별시 강남구 테헤란로 427',
      zipcode: '06164',
      isOperating: true,
      requireAdultVerification: false,
      allowGuestOrder: true,
      defaultShippingFee: 3000,
      freeShippingThreshold: 50000,
      islandMountainShippingFee: 3000,
      purchaseRewardRate: 1.5,
      textReviewReward: 500,
      photoReviewReward: 1500,
      welcomeReward: 3000,
      updatedAt: new Date(),
      updatedBy: null,
    }).getValue();

    // Mock Implementations
    mockProductRepo = {
      findById: vi.fn(async (id: string) => productsStore.get(id) || null),
      findByProductCode: vi.fn(),
      findMany: vi.fn(async () => ({
        products: Array.from(productsStore.values()),
        totalCount: productsStore.size,
      })),
      save: vi.fn(async (product: Product) => {
        productsStore.set(product.id, product);
      }),
      update: vi.fn(async (product: Product) => {
        productsStore.set(product.id, product);
      }),
      delete: vi.fn(async (id: string) => {
        productsStore.delete(id);
      }),
    };

    mockCategoryRepo = {
      findById: vi.fn(async (id: string) => categoriesStore.get(id) || null),
      findBySlug: vi.fn(async (slug: string) =>
        Array.from(categoriesStore.values()).find((c) => c.slug === slug) || null
      ),
      findAllActive: vi.fn(async () =>
        Array.from(categoriesStore.values()).filter((c) => c.isActive)
      ),
      findAll: vi.fn(async () => Array.from(categoriesStore.values())),
      findByParentId: vi.fn(async (parentId: string | null) =>
        Array.from(categoriesStore.values()).filter((c) =>
          parentId === null ? !c.parentId : c.parentId === parentId
        )
      ),
      save: vi.fn(async (category: Category) => {
        categoriesStore.set(category.id, category);
      }),
      update: vi.fn(async (category: Category) => {
        categoriesStore.set(category.id, category);
      }),
      delete: vi.fn(async (id: string) => {
        categoriesStore.delete(id);
      }),
    };

    mockOrderRepo = {
      findById: vi.fn(async (id: string) => ordersStore.get(id) || null),
      findByOrderNumber: vi.fn(async (orderNumber: string) =>
        Array.from(ordersStore.values()).find(
          (o) => o.orderNumber.value === orderNumber
        ) || null
      ),
      findMany: vi.fn(async () => ({
        orders: Array.from(ordersStore.values()),
        totalCount: ordersStore.size,
      })),
      save: vi.fn(async (order: Order) => {
        ordersStore.set(order.id, order);
      }),
      nextOrderNumber: vi.fn(async () => OrderNumber.generate()),
    };

    mockStoreSettingsRepo = {
      getSettings: vi.fn(async () => settingsStore),
      saveSettings: vi.fn(async (settings: StoreSettings) => {
        settingsStore = settings;
      }),
    };

    mockPaymentGateway = {
      requestPayment: vi.fn(async (params): Promise<Result<PaymentApprovalResult, DomainError>> =>
        ok({
          transactionId: 'PAYPAL-TX-998877',
          approvedAt: new Date(),
          amount: params.amount,
          paymentMethod: params.paymentMethod,
          rawDetails: {},
        })
      ),
      refundPayment: vi.fn(async (params): Promise<Result<PaymentRefundResult, DomainError>> =>
        ok({
          refundId: 'REFUND-TX-1234',
          refundedAt: new Date(),
          amount: params.amount,
          rawDetails: {},
        })
      ),
    };

    mockCouponRepo = {
      findById: vi.fn(),
      findAvailableByCustomerId: vi.fn(async () => []),
      findAllByCustomerId: vi.fn(async () => []),
      save: vi.fn(),
      issueCoupon: vi.fn(),
    };

    mockPointRepo = {
      getCurrentBalance: vi.fn(async () => 10000),
      findByCustomerId: vi.fn(async () => []),
      recordTransaction: vi.fn(),
    };
  });

  it('Stage 1~40 엔드-투-엔드 전체 라이프사이클 흐름이 무결하게 동작한다', async () => {
    // -------------------------------------------------------------
    // Phase 1: 장바구니 담기 및 상품 금액 계산 (Cart & Items)
    // -------------------------------------------------------------
    const cart = Cart.create({ userId: 'user-vip-1' }).getValue();
    const product = productsStore.get('prod-jacket-1')!;

    // 10% 할인가 108,000 KRW x 2개 = 216,000 KRW
    const discountedPrice = product.salePrice.amount;
    expect(discountedPrice).toBe(108000);

    const cartItem = CartItem.create({
      productId: product.id,
      productName: product.nameKo,
      price: Money.create(discountedPrice),
      quantity: 2,
      shippingFee: Money.create(3000),
      coverImageUrl: product.additionalImages[0],
    }).getValue();

    cart.addItem(cartItem);
    expect(cart.items).toHaveLength(1);
    expect(cart.totalItemCount()).toBe(2);
    expect(cart.totalProductAmount().amount).toBe(216000);

    // -------------------------------------------------------------
    // Phase 2: 배송비 정책 및 주문서 생성 (CreateOrderUseCase)
    // -------------------------------------------------------------
    // 216,000 KRW >= 50,000 KRW (무료 배송 임계치 초과 -> 배송비 0원)
    const shippingFee = cart.totalPaymentAmount().amount - cart.totalProductAmount().amount;
    expect(shippingFee).toBe(0);

    const createOrderUseCase = new CreateOrderUseCase(
      mockOrderRepo,
      mockProductRepo,
      mockCouponRepo,
      mockPointRepo
    );

    const orderCreationResult = await createOrderUseCase.execute({
      customerId: 'user-vip-1',
      items: [
        {
          productId: product.id,
          quantity: 2,
        },
      ],
      shippingAddress: {
        recipientName: '홍길동',
        recipientPhone: '010-1234-5678',
        address: '서울특별시 강남구 테헤란로 123 7층 701호',
        zipcode: '06123',
        message: '부재 시 문 앞에 놓아주세요.',
      },
      paymentMethod: 'PAYPAL',
      couponId: null,
      pointsToUse: 6000, // 6,000 포인트 사용
    });

    expect(orderCreationResult.isSuccess).toBe(true);
    const createdOrderOutput = orderCreationResult.getValue();
    expect(createdOrderOutput.status).toBe('PAYMENT_PENDING');
    // 총 216,000원 - 6,000포인트 = 210,000원
    expect(createdOrderOutput.totalPaidAmount).toBe(210000);
    expect(ordersStore.has(createdOrderOutput.orderId)).toBe(true);

    // -------------------------------------------------------------
    // Phase 3: PG 결제 승인 처리 (ApprovePaymentUseCase)
    // -------------------------------------------------------------
    const approvePaymentUseCase = new ApprovePaymentUseCase(
      mockOrderRepo,
      mockPaymentGateway,
      mockProductRepo,
      mockPointRepo
    );

    const paymentResult = await approvePaymentUseCase.execute({
      orderId: createdOrderOutput.orderId,
      paymentDetails: { paymentKey: 'PAYPAL-TX-998877' },
    });

    expect(paymentResult.isSuccess).toBe(true);
    const paidOrder = ordersStore.get(createdOrderOutput.orderId)!;
    expect(paidOrder.status).toBe('PAID');

    // -------------------------------------------------------------
    // Phase 4: 관리자 주문/배송 처리 (Admin Order Delivery Lifecycle)
    // -------------------------------------------------------------
    const getAdminOrdersUseCase = new GetAdminOrdersUseCase(mockOrderRepo);
    const adminOrdersList = await getAdminOrdersUseCase.execute();
    expect(adminOrdersList.isSuccess).toBe(true);
    expect(adminOrdersList.getValue().orders).toHaveLength(1);

    const updateDeliveryUseCase = new UpdateOrderDeliveryUseCase(mockOrderRepo);

    // 4-1. 상품 준비중(PREPARING)으로 변경
    const prepResult = await updateDeliveryUseCase.execute({
      orderId: createdOrderOutput.orderId,
      targetStatus: 'PREPARING',
    });
    expect(prepResult.isSuccess).toBe(true);
    expect(ordersStore.get(createdOrderOutput.orderId)!.status).toBe('PREPARING');

    // 4-2. 배송중(SHIPPING)으로 변경 (송장번호 및 택배사 등록)
    const shipResult = await updateDeliveryUseCase.execute({
      orderId: createdOrderOutput.orderId,
      targetStatus: 'SHIPPING',
      trackingCompany: 'CJ대한통운',
      trackingNumber: '6892-1234-5678',
    });
    expect(shipResult.isSuccess).toBe(true);
    const shippingOrder = ordersStore.get(createdOrderOutput.orderId)!;
    expect(shippingOrder.status).toBe('SHIPPING');
    expect(shippingOrder.trackingCompany).toBe('CJ대한통운');
    expect(shippingOrder.trackingNumber).toBe('6892-1234-5678');

    // 4-3. 배송완료(DELIVERED) 처리
    const deliverResult = await updateDeliveryUseCase.execute({
      orderId: createdOrderOutput.orderId,
      targetStatus: 'DELIVERED',
    });
    expect(deliverResult.isSuccess).toBe(true);
    expect(ordersStore.get(createdOrderOutput.orderId)!.status).toBe('DELIVERED');

    // -------------------------------------------------------------
    // Phase 5: 반품 신청 및 관리자 반품 승인/환불 (Claims Lifecycle)
    // -------------------------------------------------------------
    const requestReturnUseCase = new RequestReturnUseCase(mockOrderRepo);
    const returnReqResult = await requestReturnUseCase.execute({
      orderId: createdOrderOutput.orderId,
      reason: '단순 변심 (사이즈 교환 원함)',
    });
    expect(returnReqResult.isSuccess).toBe(true);
    expect(ordersStore.get(createdOrderOutput.orderId)!.status).toBe('RETURN_REQUESTED');

    const approveReturnUseCase = new ApproveReturnUseCase(
      mockOrderRepo,
      mockPaymentGateway,
      mockProductRepo,
      mockPointRepo
    );
    const approveClaimResult = await approveReturnUseCase.execute({
      orderId: createdOrderOutput.orderId,
      adminNote: '반품 상품 검수 완료 및 환불 승인',
    });
    expect(approveClaimResult.isSuccess).toBe(true);
    expect(ordersStore.get(createdOrderOutput.orderId)!.status).toBe('RETURNED');
    expect(mockPaymentGateway.refundPayment).toHaveBeenCalled();

    // -------------------------------------------------------------
    // Phase 6: 카테고리 CMS 관리 (Create, Reorder)
    // -------------------------------------------------------------
    const createCategoryUseCase = new CreateCategoryUseCase(mockCategoryRepo);
    const newCategoryResult = await createCategoryUseCase.execute({
      name: '아우터/자켓',
      slug: 'outer-jackets',
      parentId: 'cat-fashion',
      sortOrder: 1,
      isActive: true,
    });
    expect(newCategoryResult.isSuccess).toBe(true);
    const subCategory = newCategoryResult.getValue();
    expect(subCategory.depth).toBe(2);
    expect(subCategory.parentId).toBe('cat-fashion');

    const reorderUseCase = new ReorderCategoriesUseCase(mockCategoryRepo);
    const reorderResult = await reorderUseCase.execute([
      { id: 'cat-fashion', sortOrder: 5 },
      { id: subCategory.id, sortOrder: 2 },
    ]);
    expect(reorderResult.isSuccess).toBe(true);
    expect(categoriesStore.get('cat-fashion')!.sortOrder).toBe(5);

    // -------------------------------------------------------------
    // Phase 7: 쇼핑몰 환경설정 업데이트 (Store Settings)
    // -------------------------------------------------------------
    const updateSettingsUseCase = new UpdateStoreSettingsUseCase(mockStoreSettingsRepo);
    const updateSettingsResult = await updateSettingsUseCase.execute({
      storeName: 'CommerceHub 글로벌 플래그십',
      representativeName: settingsStore.representativeName,
      businessNumber: settingsStore.businessNumber,
      ecommercePermitNumber: settingsStore.ecommercePermitNumber,
      csPhone: settingsStore.csPhone,
      csEmail: settingsStore.csEmail,
      address: settingsStore.address,
      zipcode: settingsStore.zipcode,
      isOperating: settingsStore.isOperating,
      requireAdultVerification: settingsStore.requireAdultVerification,
      allowGuestOrder: settingsStore.allowGuestOrder,
      defaultShippingFee: settingsStore.defaultShippingFee,
      freeShippingThreshold: 70000,
      islandMountainShippingFee: settingsStore.islandMountainShippingFee,
      purchaseRewardRate: 2.0,
      textReviewReward: settingsStore.textReviewReward,
      photoReviewReward: settingsStore.photoReviewReward,
      welcomeReward: settingsStore.welcomeReward,
    });
    expect(updateSettingsResult.isSuccess).toBe(true);
    expect(settingsStore.storeName).toBe('CommerceHub 글로벌 플래그십');
    expect(settingsStore.freeShippingThreshold).toBe(70000);
    expect(settingsStore.purchaseRewardRate).toBe(2.0);
  });
});
