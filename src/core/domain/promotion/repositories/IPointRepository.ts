import type { PointTransaction } from '../entities/PointTransaction';

export interface IPointRepository {
  /**
   * 고객의 적립금 거래 내역 목록 조회 (최신순)
   */
  findByCustomerId(customerId: string, limit?: number): Promise<PointTransaction[]>;

  /**
   * 고객의 현재 유효 적립금 잔액 조회
   */
  getCurrentBalance(customerId: string): Promise<number>;

  /**
   * 신규 거래 내역 기록
   */
  recordTransaction(transaction: PointTransaction): Promise<void>;
}
