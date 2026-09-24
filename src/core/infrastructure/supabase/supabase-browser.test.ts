// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getAdminClient } from './admin';
import { getBrowserClient } from './client';

describe('Supabase Browser Environment Guards', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key-test';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('브라우저 환경(jsdom)에서 getAdminClient 호출 시 에러를 던져야 한다', () => {
    expect(() => getAdminClient()).toThrow(
      'getAdminClient cannot be called in the browser environment.'
    );
  });

  it('브라우저 환경에서 getBrowserClient를 정상 생성하고 싱글톤을 유지한다', () => {
    const client1 = getBrowserClient();
    const client2 = getBrowserClient();

    expect(client1).toBeDefined();
    expect(client1).toBe(client2);
  });
});

