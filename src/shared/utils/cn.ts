type ClassValue = string | number | boolean | undefined | null;

/**
 * 클래스네임을 조건부로 결합하고 공백을 정규화하는 유틸리티 함수
 */
export function cn(...inputs: ClassValue[]): string {
  return inputs
    .filter((x): x is string | number => Boolean(x) && typeof x !== 'boolean')
    .map(String)
    .join(' ')
    .trim()
    .replace(/\s+/g, ' ');
}

