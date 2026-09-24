import type {
  OrderStatus,
  OrderItemStatus,
  PaymentMethod,
  PaymentStatus,
} from '@/shared/types/database.types';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PAYMENT_PENDING: '결제 대기',
  PAID: '결제 완료',
  PREPARING: '배송 준비 중',
  SHIPPING: '배송 중',
  DELIVERED: '배송 완료',
  CANCEL_REQUESTED: '취소 요청',
  CANCELLED: '주문 취소',
  RETURN_REQUESTED: '반품 요청',
  RETURNED: '반품 완료',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CREDIT_CARD: '신용/체크카드',
  NAVER_PAY: '네이버페이',
  KAKAO_PAY: '카카오페이',
  TOSS_PAY: '토스페이',
  VIRTUAL_ACCOUNT: '가상계좌',
  MOBILE: '휴대폰 결제',
  PAYPAL: 'PayPal (페이팔)',
};

export interface OrderItemDetailDTO {
  id: string;
  productId?: string | null;
  variantId?: string | null;
  productName: string;
  variantName?: string | null;
  productImageUrl?: string | null;
  skuCode?: string | null;
  unitPrice: number;
  quantity: number;
  discountAmount: number;
  totalPrice: number;
  status: OrderItemStatus;
}

export interface OrderDetailDTO {
  id: string;
  orderNumber: string;
  customerId?: string | null;
  orderName: string;
  status: OrderStatus;
  statusLabel: string;
  items: OrderItemDetailDTO[];
  totalProductAmount: number;
  discountAmount: number;
  pointUsed: number;
  shippingFee: number;
  totalPaidAmount: number;
  payment: {
    method: PaymentMethod;
    methodLabel: string;
    status: PaymentStatus;
    details?: Record<string, unknown> | null;
    paidAt?: string | null;
  };
  shippingAddress: {
    recipientName: string;
    recipientPhone: string;
    address: string;
    zipcode: string;
    message?: string | null;
  };
  tracking?: {
    company?: string | null;
    number?: string | null;
  };
  createdAt: string;
  paidAt?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
}

export interface OrderListItemDTO {
  id: string;
  orderNumber: string;
  orderName: string;
  status: OrderStatus;
  statusLabel: string;
  itemCount: number;
  firstItemImageUrl?: string | null;
  totalPaidAmount: number;
  paymentMethodLabel: string;
  createdAt: string;
}

export interface UserOrdersResultDTO {
  orders: OrderListItemDTO[];
  totalCount: number;
}

