/**
 * 도메인 엔티티(Entity) 추상 기본 클래스
 * 엔티티는 고유 식별자(id)를 통해 생명주기 동안 식별되며, 속성이 변해도 id가 같으면 동일한 엔티티로 취급됩니다.
 */
export abstract class Entity<T> {
  protected readonly _id: string;
  protected readonly props: T;

  constructor(props: T, id?: string) {
    this._id = id ? id : crypto.randomUUID();
    this.props = props;
  }

  get id(): string {
    return this._id;
  }

  /**
   * 다른 엔티티와의 동등성 비교 (식별자 기반)
   */
  public equals(object?: Entity<T>): boolean {
    if (object === null || object === undefined) {
      return false;
    }

    if (this === object) {
      return true;
    }

    if (!(object instanceof Entity)) {
      return false;
    }

    return this._id === object._id;
  }
}

