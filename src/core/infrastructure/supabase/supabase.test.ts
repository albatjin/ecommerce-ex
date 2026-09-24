// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getSupabaseEnv } from './env';
import { getAdminClient } from './admin';

describe('Supabase Environment & Client Factories', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getSupabaseEnv', () => {
    it('필수 환경변수가 존재할 때 정상적으로 반환한다', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key-test';

      const env = getSupabaseEnv();
      expect(env.url).toBe('https://example.supabase.co');
      expect(env.anonKey).toBe('anon-key-test');
    });

    it('NEXT_PUBLIC_SUPABASE_URL이 누락되면 에러를 던진다', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key-test';

      expect(() => getSupabaseEnv()).toThrow('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
    });

    it('NEXT_PUBLIC_SUPABASE_ANON_KEY가 누락되면 에러를 던진다', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      expect(() => getSupabaseEnv()).toThrow('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
    });
  });

  describe('getAdminClient', () => {
    it('SUPABASE_SERVICE_ROLE_KEY가 없으면 에러를 발생시킨다', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key-test';
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      expect(() => getAdminClient()).toThrow(
        'SUPABASE_SERVICE_ROLE_KEY is required to initialize Admin client.'
      );
    });

    it('SERVICE_ROLE_KEY가 주어지면 Admin 클라이언트를 정상 생성한다', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key-test';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test-key';

      const adminClient = getAdminClient();
      expect(adminClient).toBeDefined();
      expect(typeof adminClient.from).toBe('function');
    });
  });
});

