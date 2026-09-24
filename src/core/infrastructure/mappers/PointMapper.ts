import { PointTransaction } from '@/core/domain/promotion/entities/PointTransaction';
import type { Database } from '@/shared/types/database.types';

type PointTransactionRow = Database['public']['Tables']['point_transactions']['Row'];
type PointTransactionInsert = Database['public']['Tables']['point_transactions']['Insert'];

export class PointMapper {
  public static toDomain(row: PointTransactionRow): PointTransaction {
    const result = PointTransaction.create(
      {
        customerId: row.customer_id,
        orderId: row.order_id,
        amount: Number(row.amount),
        balanceAfter: Number(row.balance_after),
        description: row.description,
        createdAt: new Date(row.created_at),
      },
      row.id
    );

    if (result.isFailure) {
      throw new Error(`Failed to map PointTransactionRow to Domain: ${result.getError().message}`);
    }

    return result.getValue();
  }

  public static toPersistence(tx: PointTransaction): PointTransactionInsert {
    return {
      id: tx.id,
      customer_id: tx.customerId,
      order_id: tx.orderId ?? null,
      amount: tx.amount,
      balance_after: tx.balanceAfter,
      description: tx.description,
      created_at: tx.createdAt.toISOString(),
    };
  }
}

