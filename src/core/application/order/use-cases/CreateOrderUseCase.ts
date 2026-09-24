import { Result, ok, fail } from '@/core/domain/shared/Result';
import { DomainError } from '@/core/domain/shared/AppError';
import { Money } from '@/core/domain/catalog/value-objects/Money';
import { Order } from '@/core/domain/order/entities/Order';
import { OrderItem } from '@/core/domain/order/entities/OrderItem';
import { PaymentInfo } from '@/core/domain/order/value-objects/PaymentInfo';
import { ShippingAddress } from '@/core/domain/order/value-objects/ShippingAddress';
import type { IOrderRepository } from '@/core/domain/order/repositories/IOrderRepository';
import type { IProductRepository } from '@/core/domain/catalog/repositories/IProductRepository';
import type { ICouponRepository } from '@/core/domain/promotion/repositories/ICouponRepository';
import type { IPointRepository } from '@/core/domain/promotion/repositories/IPointRepository';
import type { ICartRepository } from '@/core/domain/cart/repositories/ICartRepository';
import { PointTransaction } from '@/core/domain/promotion/entities/PointTransaction';
import type { PaymentMethod, OrderStatus } from '@/shared/types/database.types';
import type { Product } from '@/core/domain/catalog/entities/Product';
import type { CustomerCoupon } from '@/core/domain/promotion/entities/CustomerCoupon';

export interface CreateOrderItemInput {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

export interface CreateOrderInput {
  customerId?: string | null;
  cartId?: string | null;
  items: CreateOrderItemInput[];
  shippingAddress: {
    recipientName: string;
    recipientPhone: string;
    address: string;
    zipcode: string;
    message?: string | null;
  };
  paymentMethod: PaymentMethod;
  couponId?: string | null;
  pointsToUse?: number;
}

export interface CreateOrderOutput {
  orderId: string;
  orderNumber: string;
  totalProductAmount: number;
  discountAmount: number;
  pointUsed: number;
  shippingFee: number;
  totalPaidAmount: number;
  status: OrderStatus;
}

export class CreateOrderUseCase {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly productRepo: IProductRepository,
    private readonly couponRepo?: ICouponRepository,
    private readonly pointRepo?: IPointRepository,
    private readonly cartRepo?: ICartRepository
  ) {}

  public async execute(input: CreateOrderInput): Promise<Result<CreateOrderOutput, DomainError>> {
    // 1. 주문 품목 존재 여부 확인
    if (!input.items || input.items.length === 0) {
      return fail(new DomainError('주문할 상품이 없습니다.'));
    }

    // 2. 배송지 유효성 검증
    const shippingAddressResult = ShippingAddress.create({
      recipientName: input.shippingAddress.recipientName,
      recipientPhone: input.shippingAddress.recipientPhone,
      address: input.shippingAddress.address,
      zipcode: input.shippingAddress.zipcode,
      message: input.shippingAddress.message,
    });

    if (shippingAddressResult.isFailure) {
      return fail(shippingAddressResult.getError());
    }
    const shippingAddress = shippingAddressResult.getValue();

    // 3. 상품 조회, 재고 검증 및 주문 품목 생성
    const orderItems: OrderItem[] = [];
    const productsToUpdate: Product[] = [];
    let productTotal = Money.zero();
    let maxItemShippingFee = Money.zero();

    for (const itemInput of input.items) {
      if (itemInput.quantity <= 0) {
        return fail(new DomainError('주문 수량은 1개 이상이어야 합니다.'));
      }

      const product = await this.productRepo.findById(itemInput.productId);
      if (!product) {
        return fail(new DomainError(`상품을 찾을 수 없습니다. (ID: ${itemInput.productId})`));
      }

      if (!product.isOrderable(itemInput.quantity)) {
        if (product.status !== 'ACTIVE') {
          return fail(new DomainError(`'${product.nameKo}' 상품은 현재 구매할 수 없는 상태입니다.`));
        }
        if (itemInput.quantity > product.maxOrderQuantity) {
          return fail(
            new DomainError(
              `'${product.nameKo}' 상품의 최대 구매 수량(${product.maxOrderQuantity}개)을 초과했습니다.`
            )
          );
        }
        return fail(
          new DomainError(
            `'${product.nameKo}' 상품의 재고가 부족합니다. (현재 재고: ${product.stock.quantity}개)`
          )
        );
      }

      const orderItemResult = OrderItem.create({
        productId: product.id,
        variantId: itemInput.variantId ?? null,
        productName: product.nameKo,
        productImageUrl: product.coverImageUrl ?? null,
        skuCode: product.skuCode ?? null,
        unitPrice: product.salePrice,
        quantity: itemInput.quantity,
        discountAmount: Money.zero(),
      });

      if (orderItemResult.isFailure) {
        return fail(orderItemResult.getError());
      }

      const orderItem = orderItemResult.getValue();
      orderItems.push(orderItem);
      productTotal = productTotal.add(orderItem.totalPrice);

      if (product.shippingFee.amount > maxItemShippingFee.amount) {
        maxItemShippingFee = product.shippingFee;
      }

      // 재고 차감 및 갱신 목록 추가
      product.deductStock(itemInput.quantity);
      productsToUpdate.push(product);
    }

    // 4. 배송비 계산 (50,000원 이상 무료배송)
    let shippingFee = Money.zero();
    if (productTotal.amount < 50000) {
      shippingFee = maxItemShippingFee.amount > 0 ? maxItemShippingFee : Money.create(3000);
    }

    // 5. 쿠폰 검증 및 할인 계산
    let couponDiscount = Money.zero();
    let couponToUpdate: CustomerCoupon | null = null;
    if (input.couponId) {
      if (!this.couponRepo) {
        return fail(new DomainError('쿠폰 서비스를 이용할 수 없습니다.'));
      }
      const coupon = await this.couponRepo.findById(input.couponId);
      if (!coupon) {
        return fail(new DomainError('존재하지 않는 쿠폰입니다.'));
      }
      if (input.customerId && coupon.customerId !== input.customerId) {
        return fail(new DomainError('본인이 보유한 쿠폰만 사용할 수 있습니다.'));
      }
      if (!coupon.isUsable(productTotal.amount)) {
        return fail(new DomainError('쿠폰 사용 조건(최소 주문금액 또는 유효기간)을 만족하지 않습니다.'));
      }

      couponDiscount = coupon.calculateDiscount(productTotal.amount);
      const markResult = coupon.markAsUsed(productTotal.amount);
      if (markResult.isFailure) {
        return fail(markResult.getError());
      }
      couponToUpdate = coupon;
    }

    // 6. 적립금 검증 및 차감 계산
    let pointUsed = Money.zero();
    if (input.pointsToUse && input.pointsToUse > 0) {
      if (!input.customerId) {
        return fail(new DomainError('비회원은 적립금을 사용할 수 없습니다.'));
      }
      if (!this.pointRepo) {
        return fail(new DomainError('적립금 서비스를 이용할 수 없습니다.'));
      }
      const currentBalance = await this.pointRepo.getCurrentBalance(input.customerId);
      if (input.pointsToUse > currentBalance) {
        return fail(
          new DomainError(`보유 적립금(${currentBalance.toLocaleString()}원)을 초과하여 사용할 수 없습니다.`)
        );
      }

      const maxUsable = Math.max(0, productTotal.amount + shippingFee.amount - couponDiscount.amount);
      if (input.pointsToUse > maxUsable) {
        return fail(
          new DomainError(`적립금은 결제 금액(${maxUsable.toLocaleString()}원)을 초과하여 사용할 수 없습니다.`)
        );
      }

      pointUsed = Money.create(input.pointsToUse);
    }

    // 7. 주문 번호 생성
    const orderNumber = await this.orderRepo.nextOrderNumber();

    // 8. 대표 주문명 생성
    const orderName =
      orderItems.length > 1
        ? `${orderItems[0].productName} 외 ${orderItems.length - 1}건`
        : orderItems[0].productName;

    // 9. 결제 정보 생성 (PAYMENT_PENDING)
    const paymentInfo = PaymentInfo.createPending(input.paymentMethod);

    // 10. 주문 Aggregate Root 생성
    const orderResult = Order.create({
      orderNumber,
      customerId: input.customerId ?? null,
      orderName,
      items: orderItems,
      status: 'PAYMENT_PENDING',
      totalProductAmount: productTotal,
      discountAmount: couponDiscount,
      pointUsed,
      shippingFee,
      paymentInfo,
      shippingAddress,
    });

    if (orderResult.isFailure) {
      return fail(orderResult.getError());
    }
    const order = orderResult.getValue();

    // 11. 트랜잭션 영속화
    // 11-1. 상품 재고 차감 반영
    for (const product of productsToUpdate) {
      await this.productRepo.update(product);
    }

    // 11-2. 쿠폰 사용 상태 저장
    if (couponToUpdate && this.couponRepo) {
      await this.couponRepo.save(couponToUpdate);
    }

    // 11-3. 적립금 차감 원장 기록
    if (pointUsed.amount > 0 && input.customerId && this.pointRepo) {
      const currentBalance = await this.pointRepo.getCurrentBalance(input.customerId);
      const spendTxResult = PointTransaction.createSpend({
        customerId: input.customerId,
        amount: pointUsed.amount,
        currentBalance,
        description: `주문 결제 적립금 사용 (${orderNumber.value})`,
        orderId: order.id,
      });
      if (spendTxResult.isSuccess) {
        await this.pointRepo.recordTransaction(spendTxResult.getValue());
      }
    }

    // 11-4. 주문 정보 저장
    await this.orderRepo.save(order);

    // 11-5. 장바구니에서 구매 품목 제거
    if (this.cartRepo) {
      const targets = new Set<string>();
      if (input.cartId) targets.add(input.cartId);
      if (input.customerId) targets.add(input.customerId);

      for (const targetId of targets) {
        try {
          const cart = await this.cartRepo.getCart(targetId);
          for (const itemInput of input.items) {
            const cartItem = cart.items.find(
              (i) =>
                i.productId === itemInput.productId &&
                (!itemInput.variantId || i.variantId === itemInput.variantId)
            );
            if (cartItem) {
              cart.removeItem(cartItem.id);
            }
          }
          await this.cartRepo.saveCart(cart);
        } catch {
          // 장바구니 정리 실패가 주문 생성을 방해하지 않도록 방어
        }
      }
    }

    return ok({
      orderId: order.id,
      orderNumber: order.orderNumber.value,
      totalProductAmount: order.totalProductAmount.amount,
      discountAmount: order.discountAmount.amount,
      pointUsed: order.pointUsed.amount,
      shippingFee: order.shippingFee.amount,
      totalPaidAmount: order.totalPaidAmount.amount,
      status: order.status,
    });
  }
}
