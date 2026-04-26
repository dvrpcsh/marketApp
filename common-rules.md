# 공통 개발 원칙 (Common Rules)

> marketApp 프로젝트의 전체 개발 원칙과 협업 규칙입니다.
> 백엔드/프론트엔드 작업 전 반드시 숙지해야 합니다.

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 서비스 명 | 마켓앱 (MarketApp) |
| 컨셉 | 신뢰 기반 무형 재화 직거래 플랫폼 |
| 핵심 가치 | 실시간 시세(데이터), 캐릭터 인증(신뢰), 커뮤니티(소통) |
| 아키텍처 | Gradle 멀티 프로젝트 (Backend + Frontend 분리) |

---

## 2. 전체 기술 스택 요약

```
[React Native / Expo]  ←→  [Spring Boot REST API]  ←→  [MySQL]
  iOS / Android / Web         Java 17, JPA, Security
```

---

## 3. 폴더 구조 원칙

- `backend/` — Spring Boot 서버 코드
- `frontend/` — React Native (Expo) 클라이언트 코드
- `docs/` 또는 루트 MD 파일 — 기술 문서 및 개발 규칙

---

## 4. 협업 규칙

### 브랜치 전략
- `master` — 배포 가능한 안정 버전
- `develop` — 개발 통합 브랜치
- `feature/{기능명}` — 기능 단위 개발 브랜치 (예: `feature/login`, `feature/market-chart`)
- `fix/{버그명}` — 버그 수정 브랜치

### 커밋 메시지 형식
```
[타입] 제목 (50자 이내)

본문 (선택, 변경 이유 중심으로 작성)
```

| 타입 | 용도 |
|------|------|
| `feat` | 새로운 기능 추가 |
| `fix` | 버그 수정 |
| `refactor` | 코드 리팩토링 (기능 변경 없음) |
| `style` | 코드 포맷팅, 세미콜론 누락 등 |
| `docs` | 문서 수정 |
| `chore` | 빌드 설정, 패키지 관리 등 |

---

## 5. 주석 작성 규칙

> 문법 설명이 아닌 **비즈니스 로직의 의도와 데이터 흐름**을 중심으로 작성합니다.

**나쁜 예시 (지양)**
```java
// i를 1 증가시킨다
i++;

// User 리스트를 반환한다
return userRepository.findAll();
```

**좋은 예시 (지향)**
```java
// 탈퇴한 회원은 조회에서 제외하고, 최근 활동순으로 정렬하여 반환
// → 마켓 신뢰 지수가 높은 사용자가 상단에 노출되도록 하기 위함
return userRepository.findActiveUsersSortedByActivityScore();
```

```javascript
// 시세 데이터는 5분 캐시 적용 - 불필요한 API 요청 최소화 목적
// 실시간성보다 서버 부하 감소를 우선시하는 설계 결정
const priceData = await getCachedMarketPrice(itemId);
```

---

## 6. 언어 규칙

- 모든 기술 문서, 주석, PR 설명은 **한국어** 기본 작성
- 변수명·함수명·클래스명은 **영어** 사용 (카멜케이스 또는 파스칼케이스)
- API 엔드포인트 URL은 **영어 소문자 + 하이픈** 형식 (예: `/api/market-price`)

---

## 7. 환경 변수 관리

- 민감 정보(DB 비밀번호, API 키 등)는 절대 코드에 하드코딩 금지
- 백엔드: `application.properties` 또는 `application-local.properties` 활용
- 프론트엔드: `.env` 파일 활용, `.gitignore`에 반드시 포함
- 환경별 설정 분리: `local` / `dev` / `prod` 프로파일 구분

---

## 8. 마켓앱 핵심 기능별 개발 우선순위

| 우선순위 | 기능 | 설명 |
|----------|------|------|
| 1 | 회원 인증 | 회원가입, 로그인, JWT 토큰 관리 |
| 2 | 캐릭터 인증 | 스크린샷 업로드 기반 신뢰 시스템 |
| 3 | 시세 데이터 | 실시간 시세 조회 및 차트 표시 |
| 4 | 직거래 | 거래 등록, 조회, 채팅 연동 |
| 5 | 커뮤니티 | 게시판, 댓글, 알림 |
