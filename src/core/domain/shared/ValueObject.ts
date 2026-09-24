/**
 * 도메인 값 객체(Value Object) 추상 기본 클래스
 * 식별자가 없으며, 내부 속성 값들의 구조적 동등성(Structural Equality)으로 같음을 판별합니다.
 * 불변(Immutable) 상태를 유지해야 합니다.
 */
export abstract class ValueObject<T extends object> {
  public readonly props: Readonly<T>;

  constructor(props: T) {
    this.props = Object.freeze({ ...props });
  }

  /**
   * 다른 값 객체와의 구조적 동등성 비교
   */
  public equals(vo?: ValueObject<T>): boolean {
    if (vo === null || vo === undefined) {
      return false;
    }

    if (vo.props === undefined) {
      return false;
    }

    return JSON.stringify(this.props) === JSON.stringify(vo.props);
  }
}

