import { describe, it, expect } from 'vitest';
import { cn } from './cn';

describe('cn utility', () => {
  it('단일 클래스 문자열을 올바르게 반환한다', () => {
    expect(cn('btn-primary')).toBe('btn-primary');
  });

  it('여러 클래스 문자열을 결합한다', () => {
    expect(cn('px-4', 'py-2', 'rounded')).toBe('px-4 py-2 rounded');
  });

  it('falsy 값(null, undefined, false, 빈 문자열)을 올바르게 무시한다', () => {
    expect(cn('base', false && 'hidden', null, undefined, '', 'active')).toBe('base active');
  });

  it('불필요한 중복 공백을 하나로 정규화한다', () => {
    expect(cn('  text-lg   ', 'font-bold  ')).toBe('text-lg font-bold');
  });

  it('인수가 없을 때는 빈 문자열을 반환한다', () => {
    expect(cn()).toBe('');
  });
});

