import type { Metadata } from 'next';
import Link from 'next/link';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import { getOrderAction } from '@/app/actions/order.actions';
import { OrderSuccessViewer } from '@/components/checkout';

export const metadata: Metadata = {
  title: '주문 완료 | aramdream store',
  description: '주문이 성공적으로 접수되었습니다. 영수증과 배송 정보를 확인하세요.',
};

interface CheckoutSuccessPageProps {
  searchParams: Promise<{
    orderNumber?: string;
    orderId?: string;
  }>;
}

export default async function CheckoutSuccessPage({
  searchParams,
}: CheckoutSuccessPageProps) {
  const { orderNumber, orderId } = await searchParams;

  const result = await getOrderAction({
    orderNumber,
    orderId,
  });

  if (!result.success || !result.data) {
    return (
      <div className="container-custom py-16">
        <div className="max-w-md mx-auto text-center p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
              주문 정보를 찾을 수 없습니다
            </h1>
            <p className="text-sm text-slate-500">
              주문 번호가 올바르지 않거나 이미 만료된 세션일 수 있습니다. 마이페이지에서 주문 내역을 확인해 주세요.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href="/my-page/orders"
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all"
            >
              <span>주문 내역으로 이동</span>
            </Link>
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-6 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>상품 목록 둘러보기</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <OrderSuccessViewer order={result.data} />;
}

