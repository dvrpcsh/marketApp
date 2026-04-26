# 백엔드 개발 규칙 (Backend Rules)

> `backend/` 디렉토리 내 Spring Boot 서버 개발에 적용되는 규칙입니다.

---

## 1. 기술 스택

| 항목 | 버전/내용 |
|------|-----------|
| 언어 | Java 17 |
| 프레임워크 | Spring Boot 4.0.5 |
| ORM | Spring Data JPA (Hibernate) |
| 데이터베이스 | MySQL |
| 보안 | Spring Security |
| 유효성 검증 | spring-boot-starter-validation |
| 코드 간소화 | Lombok |
| 빌드 도구 | Gradle (멀티 모듈) |

---

## 2. 실행 전 체크리스트

- [ ] Java 17 환경 변수(`JAVA_HOME`) 설정 확인
- [ ] `application.properties` 내 MySQL 연결 정보 설정 여부 (URL, ID, PW)
- [ ] MySQL 서버 실행 여부 확인
- [ ] IDE Lombok 플러그인 활성화 확인 (IntelliJ: Annotation Processor 활성화)
- [ ] `application-local.properties` 파일 존재 여부 확인 (민감 정보 분리)

---

## 3. 패키지 구조

```
com.marketapp.backend/
├── controller/      # API 엔드포인트, 요청/응답 처리
├── service/         # 비즈니스 로직
├── repository/      # DB 접근 계층 (JPA Repository)
├── entity/          # DB 테이블 매핑 클래스
├── dto/             # 요청(Request) / 응답(Response) 데이터 객체
├── config/          # Spring Security, JPA 등 설정 클래스
├── exception/       # 커스텀 예외 및 글로벌 예외 핸들러
└── util/            # 공통 유틸리티 클래스
```

---

## 4. 계층 구조 및 의존성 방향

```
Controller  →  Service  →  Repository  →  Entity
    ↕               ↕
  RequestDTO    ResponseDTO
```

- **Controller**: HTTP 요청 수신, DTO 변환, 응답 반환만 담당. 비즈니스 로직 금지
- **Service**: 핵심 비즈니스 로직 처리, 트랜잭션 관리 (`@Transactional`)
- **Repository**: JPA 인터페이스 선언만. 복잡한 쿼리는 JPQL 또는 QueryDSL 사용
- **Entity**: DB 스키마 정의. 비즈니스 로직 포함 금지 (상태 변경 메서드 제외)

---

## 5. API 설계 규칙

### RESTful 원칙
| 행위 | HTTP Method | 예시 |
|------|-------------|------|
| 목록 조회 | `GET` | `GET /api/items` |
| 단건 조회 | `GET` | `GET /api/items/{id}` |
| 생성 | `POST` | `POST /api/items` |
| 수정 | `PUT` / `PATCH` | `PUT /api/items/{id}` |
| 삭제 | `DELETE` | `DELETE /api/items/{id}` |

### URL 네이밍
- 소문자 + 하이픈 사용: `/api/market-price`, `/api/character-auth`
- 복수형 명사 사용: `/api/users`, `/api/items`
- 버전 관리: `/api/v1/...` (추후 도입 고려)

### 공통 응답 포맷 (ResponseDTO)
```java
// 모든 API 응답은 아래 형식을 따름
// → 프론트엔드에서 일관된 응답 처리를 위한 설계 결정
{
  "success": true,
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": { ... }
}

// 에러 응답
{
  "success": false,
  "message": "해당 아이템을 찾을 수 없습니다.",
  "data": null
}
```

---

## 6. 유효성 검증 규칙

- 모든 Controller 파라미터에 `@Valid` 필수 적용
- RequestDTO 클래스 내 Bean Validation 어노테이션으로 검증 조건 명시
- 검증 실패 시 `@ControllerAdvice`의 글로벌 예외 핸들러에서 통일 처리

```java
// 예시: 거래 등록 요청 DTO
public class CreateItemRequestDto {

    @NotBlank(message = "아이템 이름은 필수입니다.")
    private String itemName;

    @Positive(message = "가격은 0보다 커야 합니다.")
    private int price;

    @NotNull(message = "카테고리는 필수입니다.")
    private Long categoryId;
}
```

---

## 7. 보안 규칙

- 모든 API는 기본적으로 Spring Security 필터 체인의 영향을 받음
- 인증이 필요 없는 엔드포인트(회원가입, 로그인, 공개 시세 조회 등)만 `permitAll()` 명시적 허용
- 인증 방식: **JWT 토큰** 기반 Stateless 인증
- 캐릭터 인증 연동: 신뢰 등급에 따른 기능 접근 제한 고려

---

## 8. 마켓앱 특화 구현 원칙

### 시세 데이터
- 외부 시세 API 연동 시 응답 캐싱 전략 필수 수립 (Redis 또는 로컬 캐시)
- 데이터 포맷: 타임스탬프 + 가격 + 거래량을 기본 단위로 설계

### 캐릭터 인증 (신뢰 시스템)
- 스크린샷 업로드 API의 파일 크기 및 형식 검증 필수
- 인증 처리 로직의 멱등성 보장 (중복 인증 요청 방어)

### 채팅
- 저지연 메시징을 위해 WebSocket 또는 SSE(Server-Sent Events) 도입 검토
- 채팅 내역은 별도 테이블로 분리하여 아카이빙 전략 수립

---

## 9. 코드 품질 규칙

- 하나의 메서드는 하나의 책임만 가짐 (단일 책임 원칙)
- 매직 넘버/문자열 사용 금지 → 상수 또는 Enum으로 정의
- `Optional` 활용하여 NullPointerException 방어 처리
- 테스트 코드: 핵심 서비스 로직에 대한 단위 테스트 작성 필수
