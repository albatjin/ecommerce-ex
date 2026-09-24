import { describe, it, expect } from 'vitest';
import { Entity } from './Entity';

interface UserProps {
  name: string;
  email: string;
}

class TestUser extends Entity<UserProps> {
  get name(): string {
    return this.props.name;
  }

  get email(): string {
    return this.props.email;
  }
}

describe('Entity Base Class', () => {
  it('ID를 지정하지 않으면 유효한 UUID를 자동 생성한다', () => {
    const user = new TestUser({ name: '홍길동', email: 'test@example.com' });
    expect(user.id).toBeDefined();
    expect(typeof user.id).toBe('string');
    expect(user.id.length).toBeGreaterThan(10);
  });

  it('지정된 ID가 있으면 해당 ID를 그대로 유지한다', () => {
    const fixedId = 'custom-uuid-12345';
    const user = new TestUser({ name: '홍길동', email: 'test@example.com' }, fixedId);
    expect(user.id).toBe(fixedId);
  });

  it('동일한 ID를 가진 두 엔티티는 속성이 달라도 equals()가 true여야 한다', () => {
    const sharedId = 'same-id-999';
    const user1 = new TestUser({ name: '홍길동', email: 'hong@example.com' }, sharedId);
    const user2 = new TestUser({ name: '김철수', email: 'kim@example.com' }, sharedId);

    expect(user1.equals(user2)).toBe(true);
  });

  it('서로 다른 ID를 가진 두 엔티티는 equals()가 false여야 한다', () => {
    const user1 = new TestUser({ name: '홍길동', email: 'hong@example.com' }, 'id-1');
    const user2 = new TestUser({ name: '홍길동', email: 'hong@example.com' }, 'id-2');

    expect(user1.equals(user2)).toBe(false);
  });

  it('null 또는 undefined와 비교 시 false를 반환해야 한다', () => {
    const user = new TestUser({ name: '홍길동', email: 'hong@example.com' });
    expect(user.equals(undefined)).toBe(false);
  });
});

