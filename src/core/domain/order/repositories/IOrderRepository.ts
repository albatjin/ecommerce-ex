import type { Order } from '../entities/Order';
import type { OrderNumber } from '../value-objects/OrderNumber';
import type { OrderStatus } from '@/shared/types/database.types';

export interface FindOrdersFilter {
  customerId?: string;
  status?: OrderStatus;
  limit?: number;
  offset?: number;
}

export interface IOrderRepository {
  findById(id: string): Promise<Order | null>;
  findByOrderNumber(orderNumber: string): Promise<Order | null>;
  findMany(filter: FindOrdersFilter): Promise<{ orders: Order[]; totalCount: number }>;
  save(order: Order): Promise<void>;
  nextOrderNumber(): Promise<OrderNumber>;
}
