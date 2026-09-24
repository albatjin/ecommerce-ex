import { describe, it, expect } from 'vitest';
import { Result, ok, fail } from './Result';

describe('Result Monad Pattern', () => {
  it('ok()로 성공 결과를 생성하고 값을 꺼낼 수 있다', () => {
    const result = ok<number>(42);

    expect(result.isSuccess).toBe(true);
    expect(result.isFailure).toBe(false);
    expect(result.getValue()).toBe(42);
  });

  it('fail()로 실패 결과를 생성하고 에러를 꺼낼 수 있다', () => {
    const result = fail<number, string>('Invalid input');

    expect(result.isSuccess).toBe(false);
    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBe('Invalid input');
  });

  it('실패 결과에서 getValue()를 호출하면 예외를 던져야 한다', () => {
    const result = fail<number, string>('Error occurred');
    expect(() => result.getValue()).toThrow("Can't get the value of a failure result.");
  });

  it('성공 결과에서 getError()를 호출하면 예외를 던져야 한다', () => {
    const result = ok<number>(100);
    expect(() => result.getError()).toThrow("Can't get the error of a success result.");
  });

  it('map()을 통해 성공 결과의 값을 함수형으로 변환할 수 있다', () => {
    const result = ok<number>(10).map((n) => n * 2);

    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toBe(20);
  });

  it('실패 결과에 map()을 적용하면 연산 없이 실패가 유지된다', () => {
    const result = fail<number, string>('Original error').map((n) => n * 2);

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBe('Original error');
  });

  it('flatMap()을 통해 Result를 반환하는 함수를 연계할 수 있다', () => {
    const divide = (numerator: number, denominator: number): Result<number, string> => {
      if (denominator === 0) return fail('Divide by zero');
      return ok(numerator / denominator);
    };

    const successChain = ok<number>(20).flatMap((n) => divide(n, 2));
    expect(successChain.isSuccess).toBe(true);
    expect(successChain.getValue()).toBe(10);

    const failChain = ok<number>(20).flatMap((n) => divide(n, 0));
    expect(failChain.isFailure).toBe(true);
    expect(failChain.getError()).toBe('Divide by zero');
  });

  it('combine()은 모든 결과가 성공일 때 성공을 반환한다', () => {
    const res1 = ok('a');
    const res2 = ok('b');
    const res3 = ok('c');

    const combined = Result.combine([res1, res2, res3]);
    expect(combined.isSuccess).toBe(true);
  });

  it('combine()은 하나라도 실패가 있으면 첫 번째 실패를 반환한다', () => {
    const res1 = ok('a');
    const res2 = fail('First error');
    const res3 = fail('Second error');

    const combined = Result.combine([res1, res2, res3]);
    expect(combined.isFailure).toBe(true);
    expect(combined.getError()).toBe('First error');
  });
});
