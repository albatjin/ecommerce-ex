# Next.js 16 + React 19 + Supabase SSR 이커머스 플랫폼 구축 계획

## 1. 개요 및 아키텍처 원칙
본 프로젝트는 **Next.js 16.3.5 (App Router, Turbopack)**, **React 19.2.8**, **Tailwind CSS v4**, **Supabase SSR** 기반의 엔터프라이즈급 이커머스 플랫폼을 구축하는 프로젝트입니다.

### 핵심 원칙
- **Clean Architecture 4-Layer**:
  - `Domain`: 핵심 엔티티(Entities), 값 객체(Value Objects), 비즈니스 규칙, 도메인 에러, 리포지토리 인터페이스 (`src/core/domain/`)
  - `Application`: 유스케이스(Use Cases), 비즈니스 DTOs, 애플리케이션 서비스 (`src/core/application/`)
  - `Infrastructure`: Supabase SSR 클라이언트, DB 리포지토리 구현체, 외부 스토리지/결제 어댑터 (`src/core/infrastructure/`)
  - `Presentation`: Next.js App Router(`src/app`), UI 컴포넌트(`src/components`), Server Actions, Hooks (`src/presentation/` 및 `src/app/`)
- **Strict Testing**:
  - 각 스테이지마다 Vitest 기반 단위/통합 테스트를 동시 작성하고 100% 통과를 검증합니다.
- **점진적 40단계 로드맵**:
  - 총 40개의 스테이지로 세분화하여, 사용자 피드백과 승인을 받으며 순차적으로 구현합니다.

---

## 2. 전체 40개 세분화 스테이지 로드맵 (Roadmap)

### [Part 1: 기초 인프라 & 아키텍처 토대 (Stage 1 ~ 5)]
- **Stage 1 (현 단계)**: 의존성 설치, Tailwind v4 CSS 설정, Clean Architecture 4계층 디렉토리 구조 확립, Vitest 테스트 환경 가동 검증
- **Stage 2**: Supabase SSR 클라이언트 팩토리 (Browser, Server, Middleware) 및 Database TypeScript 타입 정의
- **Stage 3**: Domain 공통 Base Entity, Result 패턴, AppError 및 공통 유틸리티 구축
- **Stage 4**: Next.js App Router 미들웨어(세션 리프레시 쿠키 핸들링 & 보호 라우트/관리자 가드) 구현
- **Stage 5**: 루트 레이아웃(Root Layout), Tailwind 테마 색상/폰트 시스템, 전역 네비게이션 헤더 & 푸터 셸 구축

### [Part 2: 회원 & 인증 (Auth & User Domain) (Stage 6 ~ 10)]
- **Stage 6**: User 도메인 엔티티(User, Grade, Status) 및 IUserRepository 인터페이스 정의
- **Stage 7**: Supabase 기반 SupabaseUserRepository 구현 (CRUD, 마이그레이션 호환)
- **Stage 8**: 회원가입 & 이메일/비밀번호 로그인 Use Cases 및 Server Actions 구현
- **Stage 9**: 로그인 / 회원가입 페이지 UI, TanStack Form + Zod 스키마 검증 연동
- **Stage 10**: 마이페이지 프로필 조회 및 정보 수정(배송지, 연락처, 마케팅 수신동의) Use Case & UI

### [Part 3: 상품 카탈로그 & 카테고리 (Catalog Domain) (Stage 11 ~ 16)]
- **Stage 11**: Category & Product 엔티티, Money/Stock/Discount 값 객체 정의
- **Stage 12**: Category & Product Supabase Repository 구현
- **Stage 13**: 계층형 카테고리 트리(대/중/소) 조회 Use Case 및 글로벌 GNB 카테고리 메뉴
- **Stage 14**: 상품 목록 검색, 다중 필터링, 정렬, 페이지네이션 Use Case & Server Actions
- **Stage 15**: 상품 카탈로그 그리드, 필터 사이드바, 검색 UI 컴포넌트
- **Stage 16**: 상품 상세(SKU/옵션 선택, 실시간 재고 반영, 품절 처리) Use Case 및 상세 페이지 UI

### [Part 4: 장바구니 & 프로모션 (Cart & Promotion Domain) (Stage 17 ~ 21)]
- **Stage 17**: Cart/CartItem 도메인 엔티티 및 게스트(LocalStorage)/회원(DB) 동기화 전략
- **Stage 18**: Cart Repository 및 Use Cases (아이템 추가, 수량 변경, 선택/전체 삭제, 가격 계산)
- **Stage 19**: 장바구니 사이드 슬라이드(Drawer) 및 장바구니 전용 페이지 UI
- **Stage 20**: Coupon & Reward Point 도메인 엔티티 및 Repository 구현
- **Stage 21**: 주문서 적용 쿠폰 할인 & 적립금 차감 유효성 계산 Use Case

### [Part 5: 주문 & 결제 파이프라인 (Order & Payment Domain) (Stage 22 ~ 27)]
- **Stage 22**: Order & OrderItem 도메인 엔티티 및 상태 전이 머신(Status State Machine) 구현
- **Stage 23**: Order Supabase Repository 구현 (주문 번호 생성 및 트랜잭션 보장)
- **Stage 24**: 주문서 작성 페이지(주문자/배송지 입력, 쿠폰/적립금 선택, 최종 결제금액 요약) UI & Use Case
- **Stage 25**: 주문 생성 및 재고 차감 검증 Use Case & Server Action
- **Stage 26**: 결제 처리 어댑터(PG Mock / 가상 결제 승인) 및 결제 완료 상태 전이 처리
- **Stage 27**: 주문 완료 페이지(영수증) 및 마이페이지 주문 내역 목록/상세 조회 UI

### [Part 6: 클레임(취소/반품) & CS 고객지원 (Stage 28 ~ 31)]
- **Stage 28**: 주문 취소/반품 정책 도메인 로직 및 Use Case (상태별 취소/반품 가능 여부 검증)
- **Stage 29**: 마이페이지 주문 취소 및 반품 신청 폼 UI 컴포넌트
- **Stage 30**: Order Notes & Customer Notes CS 도메인 엔티티 및 Repository
- **Stage 31**: 고객센터 FAQ 및 1:1 고객지원 안내 페이지 UI

### [Part 7: 관리자 플랫폼 - 기반 & 통계 (Admin Core) (Stage 32 ~ 35)]
- **Stage 32**: 관리자 전용 레이아웃(Sidebar, Topbar) 및 권한(Role) 인가 시스템
- **Stage 33**: Supabase RPC `get_dashboard_summary()` 기반 대시보드 Use Case 및 4대 KPI 카드
- **Stage 34**: 관리자 일별 매출 추이 차트 및 최근 주문 실시간 모니터링 위젯
- **Stage 35**: 쇼핑몰 환경설정(`store_settings`) 조회 및 기본 배송비/사업자정보 수정 Use Case & UI

### [Part 8: 관리자 플랫폼 - 운영 & 관리 (Admin Operations) (Stage 36 ~ 39)]
- **Stage 36**: 상품 관리 CMS (상품 목록, 신규 등록/수정, Storage 이미지 업로드 연동)
- **Stage 37**: 주문/배송 관리 CMS (주문 상태 단계별 변경, 송장 번호 등록 및 배송 처리)
- **Stage 38**: 회원 관리 CMS (회원 목록 검색, 등급/상태 변경, 적립금/쿠폰 수동 지급)
- **Stage 39**: 카테고리 관리 CMS (카테고리 트리 추가/수정/삭제 및 노출 순서 변경)

### [Part 9: 종합 검증 & 릴리즈 준비 (Stage 40)]
- **Stage 40**: 전체 E2E 주문-결제-관리자 풀 사이클 흐름 통합 테스트, 린트/타입체크/빌드 검증 및 런칭 체크리스트 문서화

---

## 3. Stage 1 세부 구현 계획 (즉시 착수 대상)

Stage 1의 목표는 프로젝트의 기초 뼈대와 빌드/테스트 파이프라인을 완벽하게 가동시키는 것입니다.

### 1) 의존성 설치
- `npm install` 실행하여 누락된 node_modules 설치

### 2) Tailwind CSS v4 스타일링 환경 구성
- `src/app/globals.css` 생성 및 `@import "tailwindcss";` 설정
- 최신 Tailwind v4 설정 점검

### 3) Clean Architecture 기본 디렉토리 구조 확립
```text
src/
├── core/
│   ├── domain/
│   │   ├── shared/
│   │   └── ...
│   ├── application/
│   └── infrastructure/
├── components/
│   ├── ui/
│   └── common/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
└── shared/
    ├── types/
    └── utils/
```

### 4) Vitest 테스트 환경 검증
- `src/shared/utils/cn.ts` (클래스 결합 유틸리티) 구현
- `src/shared/utils/cn.test.ts` 단위 테스트 작성
- `npm test`를 실행하여 Vitest 테스트 러너가 정상 통과하는지 확인

---

## 4. Verification Plan

### Automated Tests
- `npm test` 실행: Vitest 단위 테스트 통과 및 테스트 커버리지 리포트 확인
- `npm run lint`: ESLint 규칙 통과 확인
- `npx tsc --noEmit`: TypeScript 타입 컴파일 에러 없음 확인

### Manual Verification
- `npm run build`: Next.js 16 빌드가 정상 성공하는지 확인

