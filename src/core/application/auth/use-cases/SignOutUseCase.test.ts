import { describe, it, expect, vi } from 'vitest';
import { SignOutUseCase } from './SignOutUseCase';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/shared/types/database.types';

describe('SignOutUseCase', () => {
  it('signOut을 호출하여 세션을 성공적으로 종료한다', async () => {
    const signOutMock = vi.fn().mockResolvedValue({ error: null });
    const mockSupabase = {
      auth: {
        signOut: signOutMock,
      },
    } as unknown as SupabaseClient<Database>;

    const useCase = new SignOutUseCase(mockSupabase);
    const result = await useCase.execute();

    expect(result.isSuccess).toBe(true);
    expect(signOutMock).toHaveBeenCalled();
  });
});

