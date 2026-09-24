import type { Cart } from '../entities/Cart';

/**
 * 장바구니 저장소 인터페이스
 * (게스트 로컬스토리지 / 세션 쿠키 / 회원 DB 호환)
 */
export interface ICartRepository {
  /**
   * 장바구니 조회 (없으면 빈 Cart 인스턴스 반환)
   */
  getCart(cartIdOrUserId: string): Promise<Cart>;

  /**
   * 장바구니 저장/동기화
   */
  saveCart(cart: Cart): Promise<void>;

  /**
   * 장바구니 초기화
   */
  clearCart(cartIdOrUserId: string): Promise<void>;
}

