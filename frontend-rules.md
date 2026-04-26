# 프론트엔드 개발 규칙 (Frontend Rules)

> `frontend/` 디렉토리 내 React Native (Expo) 클라이언트 개발에 적용되는 규칙입니다.

---

## 1. 기술 스택

| 항목 | 버전/내용 |
|------|-----------|
| 언어 | JavaScript |
| 프레임워크 | React Native 0.81.5 |
| 빌드 도구 | Expo ~54 |
| React 버전 | React 19.1.0 |
| 지원 플랫폼 | iOS / Android / Web |
| HTTP 통신 | Axios (도입 예정) |
| 상태 관리 | 미결정 (Zustand 또는 React Context 검토) |

---

## 2. 실행 전 체크리스트

- [ ] Node.js 및 npm 설치 확인
- [ ] `frontend/` 디렉토리에서 `npm install` 완료 여부 확인
- [ ] `npx expo start` 명령으로 개발 서버 구동 가능 여부 확인
- [ ] Android 에뮬레이터 / iOS 시뮬레이터 또는 실기기 Expo Go 앱 준비
- [ ] `.env` 파일 내 백엔드 API 주소 설정 여부 확인

---

## 3. 폴더 구조

```
frontend/
├── assets/              # 이미지, 아이콘, 폰트 등 정적 자원
├── src/
│   ├── components/      # 재사용 가능한 공통 UI 컴포넌트
│   │   ├── common/      # 버튼, 입력창, 카드 등 범용 컴포넌트
│   │   └── market/      # 시세 차트, 아이템 카드 등 도메인 컴포넌트
│   ├── screens/         # 화면 단위 컴포넌트 (네비게이션 연결)
│   ├── navigation/      # 화면 전환 및 네비게이터 설정
│   ├── api/             # 백엔드 API 호출 함수 모음
│   ├── hooks/           # 커스텀 훅 (데이터 패칭, 상태 관리 등)
│   ├── store/           # 전역 상태 관리 (Zustand 등)
│   ├── constants/       # 색상, 폰트 크기, API URL 등 상수 정의
│   └── utils/           # 날짜 포맷, 가격 포맷 등 유틸 함수
├── App.js               # 앱 진입점 (네비게이션 최상위 구성)
└── package.json
```

---

## 4. 컴포넌트 설계 규칙

### 공통 컴포넌트 우선 설계
- 버튼, 입력창, 카드, 모달 등 반복 사용되는 UI는 `src/components/common/`에 먼저 정의
- Props로 스타일 및 동작을 제어할 수 있게 설계하여 재사용성 극대화

### 컴포넌트 분류 기준
```
📁 common/       → 도메인 무관 범용 컴포넌트 (Button, Input, Card, Modal)
📁 market/       → 마켓앱 도메인 특화 컴포넌트 (PriceChart, ItemCard, UserBadge)
📁 screens/      → 네비게이션에 연결되는 화면 단위 컴포넌트
```

### 파일 네이밍
- 컴포넌트 파일: 파스칼케이스 (`PriceChart.js`, `UserBadge.js`)
- 훅 파일: 카멜케이스 + `use` 접두사 (`useMarketPrice.js`, `useAuth.js`)
- 유틸 파일: 카멜케이스 (`formatPrice.js`, `formatDate.js`)

---

## 5. 데이터 통신 규칙

### API 호출 구조
- 모든 API 호출은 `src/api/` 디렉토리 내 도메인별로 분리하여 관리
- 백엔드 Base URL은 환경 변수로 관리 (코드 하드코딩 금지)

```javascript
// src/api/marketApi.js 예시
// → 시세 관련 API를 한 곳에서 관리하여 URL 변경 시 일괄 대응 가능
const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export const fetchMarketPrice = async (itemId) => {
  const response = await axios.get(`${BASE_URL}/api/market-price/${itemId}`);
  return response.data;
};
```

### 에러 처리
- API 호출 실패 시 사용자에게 의미 있는 메시지 노출 (기술적 오류 메시지 직접 노출 금지)
- 네트워크 오류와 서버 에러를 구분하여 처리

---

## 6. 플랫폼 대응 규칙

- `Platform.OS` 분기 처리는 **최소화** — 플랫폼 공통 컴포넌트 우선 활용
- 불가피한 분기 처리 시 인라인 삼항 연산자 대신 별도 변수로 분리하여 가독성 확보
- 반응형 레이아웃: `Dimensions` 또는 `useWindowDimensions` 훅을 활용하여 화면 크기 대응

```javascript
// 나쁜 예시: 분기가 JSX에 섞여 가독성 저하
<View style={{ padding: Platform.OS === 'ios' ? 20 : 16 }}>

// 좋은 예시: 의도를 명확히 분리
// iOS는 노치 영역 때문에 상단 패딩이 더 필요 - SafeAreaView와 별개로 추가 처리
const topPadding = Platform.OS === 'ios' ? 20 : 16;
<View style={{ padding: topPadding }}>
```

---

## 7. 상태 관리 규칙

- **로컬 상태**: `useState` — 단일 컴포넌트 내 UI 상태에만 사용
- **서버 상태**: 커스텀 훅으로 패칭 로직 캡슐화 (React Query 도입 검토)
- **전역 상태**: 사용자 인증 정보, 장바구니 등 앱 전반에서 필요한 상태만 전역 관리
- Prop Drilling이 2단계를 초과하면 전역 상태 또는 Context 도입 검토

---

## 8. 마켓앱 특화 구현 원칙

### 시세 차트
- 실시간 데이터 시각화를 위한 차트 라이브러리 도입 필요 (`react-native-gifted-charts` 등 검토)
- 시세 데이터는 5분 캐시 적용으로 불필요한 API 요청 최소화

### 캐릭터 인증
- 스크린샷 업로드 시 `expo-image-picker` 활용
- 업로드 진행 상태를 사용자에게 명확히 표시 (로딩 인디케이터, 완료 피드백)

### 알림 및 채팅
- `expo-notifications`를 통한 푸시 알림 처리
- 채팅 화면은 저지연 UX를 위해 메시지 낙관적 업데이트(Optimistic Update) 적용 검토

---

## 9. 성능 규칙

- 이미지는 `expo-image` 컴포넌트로 최적화 렌더링 적용
- 리스트 렌더링은 `FlatList` 사용 (`ScrollView` 내 map 렌더링 금지)
- 불필요한 리렌더링 방지: `React.memo`, `useCallback`, `useMemo` 적절히 활용
