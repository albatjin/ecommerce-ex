import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/shared/types/database.types';
import type { IUserRepository, UserFilterOptions } from '@/core/domain/user/IUserRepository';
import type { User } from '@/core/domain/user/User';
import { UserMapper } from '../mappers/UserMapper';
import { getServerClient } from '../supabase/server';
import { InternalError, NotFoundError } from '@/core/domain/shared/AppError';

export class SupabaseUserRepository implements IUserRepository {
  private client?: SupabaseClient<Database>;

  constructor(client?: SupabaseClient<Database>) {
    this.client = client;
  }

  private async getClient(): Promise<SupabaseClient<Database>> {
    if (this.client) {
      return this.client;
    }
    return (await getServerClient()) as unknown as SupabaseClient<Database>;
  }

  public async findById(id: string): Promise<User | null> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new InternalError(`Failed to fetch user by id: ${error.message}`, error);
    }

    if (!data) return null;
    return UserMapper.toDomain(data);
  }

  public async findByEmail(email: string): Promise<User | null> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      throw new InternalError(`Failed to fetch user by email: ${error.message}`, error);
    }

    if (!data) return null;
    return UserMapper.toDomain(data);
  }

  public async findByCustomerNumber(customerNumber: string): Promise<User | null> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('customer_number', customerNumber)
      .maybeSingle();

    if (error) {
      throw new InternalError(`Failed to fetch user by customerNumber: ${error.message}`, error);
    }

    if (!data) return null;
    return UserMapper.toDomain(data);
  }

  public async findMany(
    options: UserFilterOptions = {}
  ): Promise<{ users: User[]; totalCount: number }> {
    const supabase = await this.getClient();
    let query = supabase.from('users').select('*', { count: 'exact' });

    if (options.role) {
      query = query.eq('role', options.role);
    }

    if (options.membershipGrade) {
      query = query.eq('membership_grade', options.membershipGrade);
    }

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.searchQuery) {
      const q = `%${options.searchQuery}%`;
      query = query.or(`name.ilike.${q},email.ilike.${q},customer_number.ilike.${q}`);
    }

    const limit = options.limit ?? 20;
    const offset = options.offset ?? 0;

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      throw new InternalError(`Failed to find users: ${error.message}`, error);
    }

    const users = (data || []).map(UserMapper.toDomain);
    return {
      users,
      totalCount: count ?? 0,
    };
  }

  public async save(user: User): Promise<void> {
    const supabase = await this.getClient();
    const persistenceData = UserMapper.toPersistence(user);

    const { error } = await supabase.from('users').insert(persistenceData);

    if (error) {
      throw new InternalError(`Failed to save user: ${error.message}`, error);
    }
  }

  public async update(user: User): Promise<void> {
    const supabase = await this.getClient();
    const updateData = UserMapper.toUpdatePersistence(user);

    const { error, count } = await supabase
      .from('users')
      .update(updateData, { count: 'exact' })
      .eq('id', user.id);

    if (error) {
      throw new InternalError(`Failed to update user: ${error.message}`, error);
    }

    if (count === 0) {
      throw new NotFoundError('User', user.id);
    }
  }

  public async delete(id: string): Promise<void> {
    const supabase = await this.getClient();
    const { error } = await supabase.from('users').delete().eq('id', id);

    if (error) {
      throw new InternalError(`Failed to delete user: ${error.message}`, error);
    }
  }
}

