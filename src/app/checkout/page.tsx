import type { Metadata } from 'next';
import Link from 'next/link';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import { getCartAction } from '@/app/actions/cart.actions';
import { getAvailablePromotionsAction } from '@/app/actions/promotion.actions';
import { getServerClient } from '@/core/infrastructure/supabase/server';
import { CheckoutViewer } from '@/components/checkout';
import type {
  CheckoutDataDTO,
  CheckoutItemDTO,
} from '@/core/application/order/dtos/CheckoutDTO';
import type { AvailableCouponDTO } from '@/core/application/promotion/dtos/PromotionDTO';

export const metadata: Metadata = {
  title: '주문 / 결제 | CommerceHub',
  description: '배송지 정보 및 결제 수단을 입력하고 주문을 완료하세요.',
};

export default async function CheckoutPage() {
  const cartResult = await getCartAction();
  const cart = cartResult.success ? cartResult.data : null;

  // 1. 장바구니 내 선택된 품목 필터링
  const selectedItems = (cart?.items || []).filter((item) => item.selected);

  // 선택된 품목이 없을 경우 안내 화면 노출
  if (selectedItems.length === 0) {
    return (
      <div className="container-custom py-16">
        <div className="max-w-md mx-auto text-center p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <ShoppingBag className="w-10 h-10 opacity-70" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
              주문할 상품이 선택되지 않았습니다
            </h1>
            <p className="text-sm text-slate-500">
              장바구니에서 주문하실 상품을 선택하신 후 다시 주문하기를 눌러주세요.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href="/cart"
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>장바구니로 돌아가기</span>
            </Link>
            <Link
              href="/products"
              className="inline-flex items-center justify-center w-full py-3 px-6 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm transition-all"
            >
              상품 카탈로그 둘러보기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. 주문 품목 및 금액 DTO 가공
  const checkoutItems: CheckoutItemDTO[] = selectedItems.map((item) => ({
    id: item.id,
    productId: item.productId,
    variantId: item.variantId,
    productName: item.productName,
    variantName: item.variantName,
    coverImageUrl: item.coverImageUrl,
    price: item.price,
    quantity: item.quantity,
    subtotal: item.subtotal,
  }));

  const productTotal = cart?.totalProductAmount || 0;
  const shippingFee = cart?.totalShippingFee || 0;

  // 3. 사용자 정보 및 가용 프로모션(쿠폰/적립금) 조회
  let defaultShippingAddress = undefined;
  let availableCoupons: AvailableCouponDTO[] = [];
  let availablePoints = 0;
  let maxPointsUsable = 0;

  try {
    const supabase = await getServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      defaultShippingAddress = {
        recipientName:
          user.user_metadata?.name || user.email?.split('@')[0] || '',
        recipientPhone: user.user_metadata?.phone || '',
        address: user.user_metadata?.default_address || '',
        zipcode: user.user_metadata?.default_zipcode || '',
        message: '부재 시 문 앞에 놓아주세요',
      };
    }

    const promotionResult = await getAvailablePromotionsAction(productTotal);
    if (promotionResult.success && promotionResult.data) {
      availableCoupons = promotionResult.data.coupons;
      availablePoints = promotionResult.data.availablePoints;
      maxPointsUsable = promotionResult.data.maxPointsUsable;
    }
  } catch {
    // 프로모션 로드 실패 시 기본 0원 처리
  }

  const initialData: CheckoutDataDTO = {
    items: checkoutItems,
    productTotal,
    shippingFee,
    availableCoupons,
    availablePoints,
    maxPointsUsable,
    defaultShippingAddress,
  };

  return <CheckoutViewer initialData={initialData} />;
}
