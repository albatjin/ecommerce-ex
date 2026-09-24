/**
 * 애플리케이션 공통 기본 에러 클래스
 */
export abstract class BaseError extends Error {
  public abstract readonly statusCode: number;
  public abstract readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * AppError 별칭 (BaseError 동일)
 */
export const AppError = BaseError;
export type AppError = BaseError;

/**
 * 리소스를 찾을 수 없을 때 (HTTP 404)
 */
export class NotFoundError extends BaseError {
  public readonly statusCode = 404;
  public readonly code = 'NOT_FOUND';

  constructor(resource: string, identifier?: string | number) {
    super(
      identifier ? `${resource} with identifier "${identifier}" was not found.` : `${resource} was not found.`
    );
  }
}

/**
 * 입력값 검증 실패 (HTTP 400)
 */
export class ValidationError extends BaseError {
  public readonly statusCode = 400;
  public readonly code = 'VALIDATION_ERROR';

  constructor(message: string, details?: unknown) {
    super(message, details);
  }
}

/**
 * 비즈니스 도메인 불변식 위반 (HTTP 422 또는 400)
 */
export class DomainError extends BaseError {
  public readonly statusCode = 422;
  public readonly code = 'DOMAIN_RULE_VIOLATION';

  constructor(message: string) {
    super(message);
  }
}

/**
 * 인증되지 않은 사용자 접근 (HTTP 401)
 */
export class UnauthorizedError extends BaseError {
  public readonly statusCode = 401;
  public readonly code = 'UNAUTHORIZED';

  constructor(message = '인증이 필요한 요청입니다.') {
    super(message);
  }
}

/**
 * 인가 권한 부족 (HTTP 403)
 */
export class ForbiddenError extends BaseError {
  public readonly statusCode = 403;
  public readonly code = 'FORBIDDEN';

  constructor(message = '해당 리소스에 접근할 권한이 없습니다.') {
    super(message);
  }
}

/**
 * 중복 리소스 또는 상태 충돌 (HTTP 409)
 */
export class ConflictError extends BaseError {
  public readonly statusCode = 409;
  public readonly code = 'CONFLICT';

  constructor(message: string) {
    super(message);
  }
}

/**
 * 서버 내부 또는 인프라 계층 예외 (HTTP 500)
 */
export class InternalError extends BaseError {
  public readonly statusCode = 500;
  public readonly code = 'INTERNAL_SERVER_ERROR';

  constructor(message = '서버 내부 처리 중 예기치 않은 오류가 발생했습니다.', details?: unknown) {
    super(message, details);
  }
}

