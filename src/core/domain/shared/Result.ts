/**
 * 비즈니스 로직 및 유스케이스에서 예외 던지기 대신
 * 타입 안전한 성공/실패 결과를 다루기 위한 Result 모나드 패턴
 */
export class Result<T, E = string> {
  public readonly isSuccess: boolean;
  public readonly isFailure: boolean;
  private readonly _value?: T;
  private readonly _error?: E;

  private constructor(isSuccess: boolean, value?: T, error?: E) {
    if (isSuccess && error !== undefined) {
      throw new Error('InvalidOperation: A result cannot be successful and contain an error.');
    }
    if (!isSuccess && error === undefined) {
      throw new Error('InvalidOperation: A failing result must contain an error.');
    }

    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this._value = value;
    this._error = error;

    Object.freeze(this);
  }

  public getValue(): T {
    if (!this.isSuccess) {
      throw new Error(`Can't get the value of a failure result. Error: ${JSON.stringify(this._error)}`);
    }
    return this._value as T;
  }

  public getError(): E {
    if (this.isSuccess) {
      throw new Error("Can't get the error of a success result.");
    }
    return this._error as E;
  }

  public map<U>(fn: (val: T) => U): Result<U, E> {
    if (this.isSuccess) {
      return Result.ok<U, E>(fn(this.getValue()));
    }
    return Result.fail<U, E>(this.getError());
  }

  public flatMap<U>(fn: (val: T) => Result<U, E>): Result<U, E> {
    if (this.isSuccess) {
      return fn(this.getValue());
    }
    return Result.fail<U, E>(this.getError());
  }

  public static ok<U, F = string>(value?: U): Result<U, F> {
    return new Result<U, F>(true, value, undefined);
  }

  public static fail<U, F = string>(error: F): Result<U, F> {
    return new Result<U, F>(false, undefined, error);
  }

  public static combine<E>(results: Result<unknown, E>[]): Result<void, E> {
    for (const result of results) {
      if (result.isFailure) {
        return Result.fail(result.getError());
      }
    }
    return Result.ok();
  }
}

export const ok = Result.ok;
export const fail = Result.fail;
