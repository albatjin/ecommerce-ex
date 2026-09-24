import type { Metadata } from 'next';
import { CartPageViewer } from '@/components/cart';

export const metadata: Metadata = {
  title: '장바구니 | CommerceHub',
  description: '담아두신 장바구니 상품을 확인하고 주문서를 작성하세요.',
};

export default function CartPage() {
  return <CartPageViewer />;
}
