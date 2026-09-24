import { describe, it, expect } from 'vitest';
import {
  BaseError,
  NotFoundError,
  ValidationError,
  DomainError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  InternalError,
} from './AppError';

describe('AppError Hierarchy', () => {
  it('NotFoundError는 상태코드 404와 적절한 식별자 메시지를 갖는다', () => {
    const error = new NotFoundError('Product', 'prod-123');

    expect(error).toBeInstanceOf(BaseError);
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.message).toContain('Product with identifier "prod-123" was not found.');
  });

  it('ValidationError는 상태코드 400과 세부 필드 정보를 담는다', () => {
    const details = { field: 'email', reason: 'Invalid format' };
    const error = new ValidationError('Validation failed', details);

    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.details).toEqual(details);
  });

  it('DomainError는 상태코드 422와 도메인 규칙 위반 코드를 갖는다', () => {
    const error = new DomainError('재고가 부족하여 주문할 수 없습니다.');

    expect(error.statusCode).toBe(422);
    expect(error.code).toBe('DOMAIN_RULE_VIOLATION');
    expect(error.message).toBe('재고가 부족하여 주문할 수 없습니다.');
  });

  it('UnauthorizedError는 상태코드 401을 갖는다', () => {
    const error = new UnauthorizedError();
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe('UNAUTHORIZED');
  });

  it('ForbiddenError는 상태코드 403을 갖는다', () => {
    const error = new ForbiddenError();
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe('FORBIDDEN');
  });

  it('ConflictError는 상태코드 409를 갖는다', () => {
    const error = new ConflictError('이미 등록된 이메일입니다.');
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe('CONFLICT');
  });

  it('InternalError는 상태코드 500을 갖는다', () => {
    const error = new InternalError();
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe('INTERNAL_SERVER_ERROR');
  });
});

