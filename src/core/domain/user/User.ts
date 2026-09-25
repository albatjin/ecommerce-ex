import { Entity } from '../shared/Entity';
import { Result, ok, fail } from '../shared/Result';
import { DomainError } from '../shared/AppError';
import type {
  UserRole,
  MembershipGrade,
  UserStatus,
  Gender,
} from '@/shared/types/database.types';

export interface UserProps {
  customerNumber: string;
  email: string;
  name: string;
  phone?: string | null;
  role: UserRole;
  avatarUrl?: string | null;
  membershipGrade: MembershipGrade;
  status: UserStatus;
  totalSpent: number;
  totalOrders: number;
  rewardPoints: number;
  couponsCount: number;
  personalCustomsCode?: string | null;
  gender?: Gender | null;
  birthYear?: number | null;
  smsConsent: boolean;
  emailConsent: boolean;
  appPushConsent: boolean;
  defaultAddress?: string | null;
  defaultZipcode?: string | null;
  lastVisitAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateProfileDTO {
  name?: string;
  phone?: string | null;
  personalCustomsCode?: string | null;
  gender?: Gender | null;
  birthYear?: number | null;
  defaultAddress?: string | null;
  defaultZipcode?: string | null;
}

export interface MarketingConsentDTO {
  smsConsent: boolean;
  emailConsent: boolean;
  appPushConsent: boolean;
}

/**
 * User 도메인 엔티티
 * 회원 정보 관리, 적립금 원장, 등급 산정 규칙 및 비즈니스 정책을 캡슐화합니다.
 */
export class User extends Entity<UserProps> {
  private constructor(props: UserProps, id?: string) {
    super(props, id);
  }

  // Getters
  get customerNumber(): string { return this.props.customerNumber; }
  get email(): string { return this.props.email; }
  get name(): string { return this.props.name; }
  get phone(): string | null | undefined { return this.props.phone; }
  get role(): UserRole { return this.props.role; }
  get avatarUrl(): string | null | undefined { return this.props.avatarUrl; }
  get membershipGrade(): MembershipGrade { return this.props.membershipGrade; }
  get status(): UserStatus { return this.props.status; }
  get totalSpent(): number { return this.props.totalSpent; }
  get totalOrders(): number { return this.props.totalOrders; }
  get rewardPoints(): number { return this.props.rewardPoints; }
  get couponsCount(): number { return this.props.couponsCount; }
  get personalCustomsCode(): string | null | undefined { return this.props.personalCustomsCode; }
  get gender(): Gender | null | undefined { return this.props.gender; }
  get birthYear(): number | null | undefined { return this.props.birthYear; }
  get smsConsent(): boolean { return this.props.smsConsent; }
  get emailConsent(): boolean { return this.props.emailConsent; }
  get appPushConsent(): boolean { return this.props.appPushConsent; }
  get defaultAddress(): string | null | undefined { return this.props.defaultAddress; }
  get defaultZipcode(): string | null | undefined { return this.props.defaultZipcode; }
  get lastVisitAt(): Date | null | undefined { return this.props.lastVisitAt; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  /**
   * 관리자 권한 여부 확인
   */
  public isAdmin(): boolean {
    return ['super_admin', 'admin', 'manager', 'staff'].includes(this.props.role);
  }

  /**
   * 활성 상태인지 확인
   */
  public isActive(): boolean {
    return this.props.status === 'ACTIVE';
  }

  /**
   * 기본 프로필 정보 업데이트
   */
  public updateProfile(dto: UpdateProfileDTO): void {
    if (dto.name !== undefined) {
      if (!dto.name.trim()) {
        throw new DomainError('회원 이름은 비어있을 수 없습니다.');
      }
      this.props.name = dto.name.trim();
    }

    if (dto.phone !== undefined) this.props.phone = dto.phone;
    if (dto.personalCustomsCode !== undefined) this.props.personalCustomsCode = dto.personalCustomsCode;
    if (dto.gender !== undefined) this.props.gender = dto.gender;
    if (dto.birthYear !== undefined) this.props.birthYear = dto.birthYear;
    if (dto.defaultAddress !== undefined) this.props.defaultAddress = dto.defaultAddress;
    if (dto.defaultZipcode !== undefined) this.props.defaultZipcode = dto.defaultZipcode;

    this.props.updatedAt = new Date();
  }

  /**
   * 마케팅 수신동의 변경
   */
  public updateMarketingConsent(dto: MarketingConsentDTO): void {
    this.props.smsConsent = dto.smsConsent;
    this.props.emailConsent = dto.emailConsent;
    this.props.appPushConsent = dto.appPushConsent;
    this.props.updatedAt = new Date();
  }

  /**
   * 적립금 적립
   */
  public addRewardPoints(amount: number): void {
    if (amount <= 0) {
      throw new DomainError('적립할 포인트는 0보다 커야 합니다.');
    }
    this.props.rewardPoints += amount;
    this.props.updatedAt = new Date();
  }

  /**
   * 적립금 사용
   */
  public useRewardPoints(amount: number): void {
    if (amount <= 0) {
      throw new DomainError('사용할 포인트는 0보다 커야 합니다.');
    }
    if (this.props.rewardPoints < amount) {
      throw new DomainError(`보유 포인트(${this.props.rewardPoints}P)가 부족하여 ${amount}P를 사용할 수 없습니다.`);
    }
    this.props.rewardPoints -= amount;
    this.props.updatedAt = new Date();
  }

  /**
   * 주문 결제 완료 시 누적 실적 반영 및 회원 등급 재산정
   */
  public recordOrderPayment(paidAmount: number): void {
    if (paidAmount < 0) {
      throw new DomainError('결제 금액은 음수일 수 없습니다.');
    }

    this.props.totalSpent += paidAmount;
    this.props.totalOrders += 1;
    this.recalculateMembershipGrade();
    this.props.updatedAt = new Date();
  }

  /**
   * 누적 결제금액 기준 등급 산정 규칙
   * - BRONZE: 10만원 미만
   * - SILVER: 10만원 이상 ~ 30만원 미만
   * - GOLD: 30만원 이상 ~ 100만원 미만
   * - VIP: 100만원 이상 ~ 300만원 미만
   * - VVIP: 300만원 이상
   */
  public recalculateMembershipGrade(): void {
    const spent = this.props.totalSpent;

    if (spent >= 3000000) {
      this.props.membershipGrade = 'VVIP';
    } else if (spent >= 1000000) {
      this.props.membershipGrade = 'VIP';
    } else if (spent >= 300000) {
      this.props.membershipGrade = 'GOLD';
    } else if (spent >= 100000) {
      this.props.membershipGrade = 'SILVER';
    } else {
      this.props.membershipGrade = 'BRONZE';
    }
  }

  /**
   * 회원 상태 변경 (정상, 휴면, 탈퇴 등)
   */
  public changeStatus(newStatus: UserStatus): void {
    this.props.status = newStatus;
    this.props.updatedAt = new Date();
  }

  /**
   * 회원 등급 관리자 수동 변경
   */
  public changeMembershipGrade(newGrade: MembershipGrade): void {
    this.props.membershipGrade = newGrade;
    this.props.updatedAt = new Date();
  }

  /**
   * 회원 역할 권한 변경
   */
  public changeRole(newRole: UserRole): void {
    this.props.role = newRole;
    this.props.updatedAt = new Date();
  }

  /**
   * User 엔티티 생성 팩토리
   */
  public static create(
    props: Omit<
      UserProps,
      | 'createdAt'
      | 'updatedAt'
      | 'totalSpent'
      | 'totalOrders'
      | 'membershipGrade'
      | 'status'
      | 'rewardPoints'
      | 'couponsCount'
    > & {
      totalSpent?: number;
      totalOrders?: number;
      membershipGrade?: MembershipGrade;
      status?: UserStatus;
      rewardPoints?: number;
      couponsCount?: number;
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: string
  ): Result<User, DomainError> {
    if (!props.email || !props.email.includes('@')) {
      return fail(new DomainError('유효한 이메일 주소를 입력해 주세요.'));
    }

    if (!props.name || props.name.trim().length === 0) {
      return fail(new DomainError('회원 이름은 필수 항목입니다.'));
    }

    const now = new Date();
    const user = new User(
      {
        ...props,
        totalSpent: props.totalSpent ?? 0,
        totalOrders: props.totalOrders ?? 0,
        membershipGrade: props.membershipGrade ?? 'BRONZE',
        status: props.status ?? 'ACTIVE',
        rewardPoints: props.rewardPoints ?? 0,
        couponsCount: props.couponsCount ?? 0,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id
    );

    return ok(user);
  }
}

