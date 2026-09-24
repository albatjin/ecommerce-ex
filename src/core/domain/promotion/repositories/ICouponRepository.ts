import type { CustomerCoupon } from '../entities/CustomerCoupon';

export interface ICouponRepository {
  /**
   * 고객이 보유한 사용 가능한 쿠폰 목록 조회 (미사용 및 미만료)
   */
  findAvailableByCustomerId(customerId: string): Promise<CustomerCoupon[]>;

  /**
   * 고객이 보유한 모든 쿠폰 목록 조회 (사용/만료 포함)
   */
  findAllByCustomerId(customerId: string): Promise<CustomerCoupon[]>;

  /**
   * 쿠폰 단건 ID 조회
   */
  findById(id: string): Promise<CustomerCoupon | null>;

  /**
   * 쿠폰 상태 업데이트 (사용 처리 등)
   */
  save(customerCoupon: CustomerCoupon): Promise<void>;

  /**
   * 신규 쿠폰 발급
   */
  issueCoupon(customerCoupon: CustomerCoupon): Promise<void>;
}
