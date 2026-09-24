import { describe, it, expect, vi } from 'vitest';
import { SupabasePointRepository } from './SupabasePointRepository';
import { PointTransaction } from '@/core/domain/promotion/entities/PointTransaction';
import type { Database } from '@/shared/types/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';

type PointTransactionRow = Database['public']['Tables']['point_transactions']['Row'];

describe('SupabasePointRepository', () => {
  const sampleTxRow: PointTransactionRow = {
    id: 'tx-1',
    customer_id: 'user-1',
    order_id: null,
    amount: 3000,
    balance_after: 3000,
    description: '회원가입 축하 적립금',
    created_at: '2026-01-01T00:00:00.000Z',
  };

  it('findByCustomerId: 적립금 거래 내역 목록을 최신순으로 조회한다', async () => {
    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [sampleTxRow], error: null }),
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient<Database>;

    const repo = new SupabasePointRepository(mockClient);
    const txs = await repo.findByCustomerId('user-1');

    expect(txs).toHaveLength(1);
    expect(txs[0].description).toBe('회원가입 축하 적립금');
    expect(txs[0].amount).toBe(3000);
    expect(txs[0].balanceAfter).toBe(3000);
  });

  it('getCurrentBalance: 회원의 현재 적립금 잔액을 조회한다', async () => {
    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { reward_points: 15000 },
              error: null,
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient<Database>;

    const repo = new SupabasePointRepository(mockClient);
    const balance = await repo.getCurrentBalance('user-1');

    expect(balance).toBe(15000);
  });

  it('recordTransaction: 거래 내역을 삽입하고 회원 잔액을 갱신한다', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === 'point_transactions') {
          return { insert: insertMock };
        }
        if (table === 'users') {
          return { update: updateMock };
        }
        return {};
      }),
    } as unknown as SupabaseClient<Database>;

    const repo = new SupabasePointRepository(mockClient);
    const tx = PointTransaction.createEarn({
      customerId: 'user-1',
      amount: 2000,
      currentBalance: 5000,
      description: '리뷰 작성 적립',
    }).getValue();

    await repo.recordTransaction(tx);

    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        reward_points: 7000,
      })
    );
  });
});
