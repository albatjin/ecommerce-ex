'use server';

import { revalidatePath } from 'next/cache';
import { getServerClient } from '@/core/infrastructure/supabase/server';
import { getCartSessionId } from './cart.actions';
import { CookieCartRepository } from '@/core/infrastructure/repositories/CookieCartRepository';
import { SupabaseOrderRepository } from '@/core/infrastructure/repositories/SupabaseOrderRepository';
import { SupabaseProductRepository } from '@/core/infrastructure/repositories/SupabaseProductRepository';
import { SupabaseCouponRepository } from '@/core/infrastructure/repositories/SupabaseCouponRepository';
import { SupabasePointRepository } from '@/core/infrastructure/repositories/SupabasePointRepository';
import { MockPaymentGateway } from '@/core/infrastructure/gateways/MockPaymentGateway';
import {
  CreateOrderUseCase,
  type CreateOrderItemInput,
  type CreateOrderOutput,
} from '@/core/application/order/use-cases/CreateOrderUseCase';
import {
  ApprovePaymentUseCase,
  type ApprovePaymentOutput,
} from '@/core/application/order/use-cases/ApprovePaymentUseCase';
import { GetOrderUseCase } from '@/core/application/order/use-cases/GetOrderUseCase';
import { GetUserOrdersUseCase } from '@/core/application/order/use-cases/GetUserOrdersUseCase';
import {
  CancelOrderUseCase,
  type CancelOrderOutput,
} from '@/core/application/order/use-cases/CancelOrderUseCase';
import {
  RequestReturnUseCase,
  type RequestReturnOutput,
} from '@/core/application/order/use-cases/RequestReturnUseCase';
import {
  ApproveReturnUseCase,
  type ApproveReturnOutput,
} from '@/core/application/order/use-cases/ApproveReturnUseCase';
import {
  RejectReturnUseCase,
  type RejectReturnOutput,
} from '@/core/application/order/use-cases/RejectReturnUseCase';
import {
  GetAdminOrdersUseCase,
  type GetAdminOrdersInput,
  type AdminOrdersResultDTO,
} from '@/core/application/order/use-cases/GetAdminOrdersUseCase';
import type { PlaceOrderInput } from '@/core/application/order/dtos/CheckoutDTO';
import type {
  OrderDetailDTO,
  UserOrdersResultDTO,
} from '@/core/application/order/dtos/OrderDTO';
import type { OrderStatus } from '@/shared/types/database.types';

export interface CancelOrderActionInput {
  orderId: string;
  reason?: string;
}

export interface CancelOrderActionResult {
  success: boolean;
  data?: CancelOrderOutput;
  error?: string;
}

export interface RequestReturnActionInput {
  orderId: string;
  reason: string;
}

export interface RequestReturnActionResult {
  success: boolean;
  data?: RequestReturnOutput;
  error?: string;
}

export interface ApproveReturnActionInput {
  orderId: string;
  adminNote?: string;
}

export interface ApproveReturnActionResult {
  success: boolean;
  data?: ApproveReturnOutput;
  error?: string;
}

export interface RejectReturnActionInput {
  orderId: string;
  reason: string;
}

export interface RejectReturnActionResult {
  success: boolean;
  data?: RejectReturnOutput;
  error?: string;
}

export interface GetAdminOrdersActionResult {
  success: boolean;
  data?: AdminOrdersResultDTO;
  error?: string;
}

export interface OrderActionResult {
  success: boolean;
  data?: CreateOrderOutput;
  error?: string;
}

export interface ApprovePaymentActionResult {
  success: boolean;
  data?: ApprovePaymentOutput;
  error?: string;
}

export interface GetOrderActionResult {
  success: boolean;
  data?: OrderDetailDTO;
  error?: string;
}

export interface GetUserOrdersActionResult {
  success: boolean;
  data?: UserOrdersResultDTO;
  error?: string;
}

export interface CreateOrderActionInput extends PlaceOrderInput {
  items?: CreateOrderItemInput[];
}

/**
 * 신규 주문을 생성하고 재고 차감 및 프로모션(쿠폰/적립금)을 반영합니다.
 */
export async function createOrderAction(
  input: CreateOrderActionInput
): Promise<OrderActionResult> {
  try {
    const supabase = await getServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { cartId } = await getCartSessionId();
    const cartRepo = new CookieCartRepository();

    // 주문 품목 확정: 입력 품목이 없으면 현재 장바구니의 선택 품목 사용
    let orderItems = input.items;
    if (!orderItems || orderItems.length === 0) {
      const cart = await cartRepo.getCart(cartId);
      const selectedItems = cart.selectedItems();
      if (selectedItems.length === 0) {
        return {
          success: false,
          error: '주문할 상품이 장바구니에 선택되어 있지 않습니다.',
        };
      }
      orderItems = selectedItems.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
      }));
    }

    const orderRepo = new SupabaseOrderRepository(supabase);
    const productRepo = new SupabaseProductRepository(supabase);
    const couponRepo = new SupabaseCouponRepository(supabase);
    const pointRepo = new SupabasePointRepository(supabase);

    const useCase = new CreateOrderUseCase(
      orderRepo,
      productRepo,
      couponRepo,
      pointRepo,
      cartRepo
    );

    const result = await useCase.execute({
      customerId: user?.id ?? null,
      cartId,
      items: orderItems,
      shippingAddress: input.shippingAddress,
      paymentMethod: input.paymentMethod,
      couponId: input.couponId,
      pointsToUse: input.pointsToUse,
    });

    if (result.isFailure) {
      return {
        success: false,
        error: result.getError().message,
      };
    }

    revalidatePath('/cart');
    revalidatePath('/my-page');
    revalidatePath('/my-page/orders');

    return {
      success: true,
      data: result.getValue(),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : '주문 생성 중 예기치 않은 오류가 발생했습니다.',
    };
  }
}

/**
 * PG사 결제 승인을 요청하고 주문 상태를 결제완료(PAID)로 전환합니다.
 */
export async function approvePaymentAction(
  orderId: string,
  paymentDetails?: Record<string, unknown>
): Promise<ApprovePaymentActionResult> {
  try {
    const supabase = await getServerClient();
    const orderRepo = new SupabaseOrderRepository(supabase);
    const productRepo = new SupabaseProductRepository(supabase);
    const pointRepo = new SupabasePointRepository(supabase);
    const paymentGateway = new MockPaymentGateway();

    const useCase = new ApprovePaymentUseCase(
      orderRepo,
      paymentGateway,
      productRepo,
      pointRepo
    );

    const result = await useCase.execute({
      orderId,
      paymentDetails,
    });

    if (result.isFailure) {
      return {
        success: false,
        error: result.getError().message,
      };
    }

    revalidatePath('/cart');
    revalidatePath('/my-page');
    revalidatePath('/my-page/orders');

    return {
      success: true,
      data: result.getValue(),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : '결제 승인 처리 중 예기치 않은 오류가 발생했습니다.',
    };
  }
}

/**
 * 주문 단건 상세 조회 Action (주문 번호 또는 주문 ID)
 */
export async function getOrderAction(params: {
  orderId?: string;
  orderNumber?: string;
}): Promise<GetOrderActionResult> {
  try {
    const supabase = await getServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const orderRepo = new SupabaseOrderRepository(supabase);
    const useCase = new GetOrderUseCase(orderRepo);

    const result = await useCase.execute({
      orderId: params.orderId,
      orderNumber: params.orderNumber,
      customerId: user?.id ?? null,
    });

    if (result.isFailure) {
      return {
        success: false,
        error: result.getError().message,
      };
    }

    return {
      success: true,
      data: result.getValue(),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : '주문 정보를 불러오는 중 오류가 발생했습니다.',
    };
  }
}

/**
 * 로그인 회원의 주문 목록 조회 Action
 */
export async function getUserOrdersAction(params?: {
  status?: OrderStatus;
  limit?: number;
  offset?: number;
}): Promise<GetUserOrdersActionResult> {
  try {
    const supabase = await getServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: '로그인이 필요한 서비스입니다.',
      };
    }

    const orderRepo = new SupabaseOrderRepository(supabase);
    const useCase = new GetUserOrdersUseCase(orderRepo);

    const result = await useCase.execute({
      customerId: user.id,
      status: params?.status,
      limit: params?.limit,
      offset: params?.offset,
    });

    if (result.isFailure) {
      return {
        success: false,
        error: result.getError().message,
      };
    }

    return {
      success: true,
      data: result.getValue(),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : '주문 내역을 불러오는 중 오류가 발생했습니다.',
    };
  }
}

/**
 * 주문 취소 Action
 * 결제 완료 전(PAYMENT_PENDING) 또는 결제 완료 후(PAID) 상태의 주문을 취소하고 PG 환불, 재고 복원, 적립금 복구를 수행합니다.
 */
export async function cancelOrderAction(
  input: CancelOrderActionInput
): Promise<CancelOrderActionResult> {
  try {
    const supabase = await getServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const orderRepo = new SupabaseOrderRepository(supabase);
    const paymentGateway = new MockPaymentGateway();
    const productRepo = new SupabaseProductRepository(supabase);
    const pointRepo = new SupabasePointRepository(supabase);

    const useCase = new CancelOrderUseCase(
      orderRepo,
      paymentGateway,
      productRepo,
      pointRepo
    );

    const result = await useCase.execute({
      orderId: input.orderId,
      customerId: user?.id,
      reason: input.reason,
    });

    if (result.isFailure) {
      return {
        success: false,
        error: result.getError().message,
      };
    }

    revalidatePath('/my-page/orders');
    revalidatePath(`/my-page/orders/${input.orderId}`);
    revalidatePath('/orders');

    return {
      success: true,
      data: result.getValue(),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : '주문 취소 처리 중 오류가 발생했습니다.',
    };
  }
}

/**
 * 반품 신청 Action
 * 배송 완료(DELIVERED)된 주문에 대해 반품 요청을 접수합니다.
 */
export async function requestReturnAction(
  input: RequestReturnActionInput
): Promise<RequestReturnActionResult> {
  try {
    const supabase = await getServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const orderRepo = new SupabaseOrderRepository(supabase);
    const useCase = new RequestReturnUseCase(orderRepo);

    const result = await useCase.execute({
      orderId: input.orderId,
      customerId: user?.id,
      reason: input.reason,
    });

    if (result.isFailure) {
      return {
        success: false,
        error: result.getError().message,
      };
    }

    revalidatePath('/my-page/orders');
    revalidatePath(`/my-page/orders/${input.orderId}`);
    revalidatePath('/orders');

    return {
      success: true,
      data: result.getValue(),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : '반품 신청 처리 중 오류가 발생했습니다.',
    };
  }
}

/**
 * 반품 승인 Action (관리자 전용)
 * 고객의 반품 요청(RETURN_REQUESTED) 건을 검수 후 승인하고 PG 결제 환불, 재고 복원, 적립금을 복구합니다.
 */
export async function approveReturnAction(
  input: ApproveReturnActionInput
): Promise<ApproveReturnActionResult> {
  try {
    const supabase = await getServerClient();
    const orderRepo = new SupabaseOrderRepository(supabase);
    const paymentGateway = new MockPaymentGateway();
    const productRepo = new SupabaseProductRepository(supabase);
    const pointRepo = new SupabasePointRepository(supabase);

    const useCase = new ApproveReturnUseCase(
      orderRepo,
      paymentGateway,
      productRepo,
      pointRepo
    );

    const result = await useCase.execute(input);

    if (result.isFailure) {
      return {
        success: false,
        error: result.getError().message,
      };
    }

    revalidatePath('/admin/orders');
    revalidatePath('/my-page/orders');
    revalidatePath(`/my-page/orders/${input.orderId}`);
    revalidatePath('/orders');

    return {
      success: true,
      data: result.getValue(),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : '반품 승인 처리 중 오류가 발생했습니다.',
    };
  }
}

/**
 * 반품 반려(거절) Action (관리자 전용)
 * 반품 요청(RETURN_REQUESTED) 건을 반려하고 배송 완료(DELIVERED) 상태로 복구합니다.
 */
export async function rejectReturnAction(
  input: RejectReturnActionInput
): Promise<RejectReturnActionResult> {
  try {
    const supabase = await getServerClient();
    const orderRepo = new SupabaseOrderRepository(supabase);
    const useCase = new RejectReturnUseCase(orderRepo);

    const result = await useCase.execute(input);

    if (result.isFailure) {
      return {
        success: false,
        error: result.getError().message,
      };
    }

    revalidatePath('/admin/orders');
    revalidatePath('/my-page/orders');
    revalidatePath(`/my-page/orders/${input.orderId}`);
    revalidatePath('/orders');

    return {
      success: true,
      data: result.getValue(),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : '반품 반려 처리 중 오류가 발생했습니다.',
    };
  }
}

/**
 * 관리자 주문 및 클레임 목록 조회 Action
 */
export async function getAdminOrdersAction(
  input: GetAdminOrdersInput = {}
): Promise<GetAdminOrdersActionResult> {
  try {
    const supabase = await getServerClient();
    const orderRepo = new SupabaseOrderRepository(supabase);
    const useCase = new GetAdminOrdersUseCase(orderRepo);

    const result = await useCase.execute(input);

    if (result.isFailure) {
      return {
        success: false,
        error: result.getError().message,
      };
    }

    return {
      success: true,
      data: result.getValue(),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : '관리자 주문 목록 조회 중 오류가 발생했습니다.',
    };
  }
}


