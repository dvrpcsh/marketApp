// 디자인 시스템의 단일 진실 공급원 (Single Source of Truth)
// 색상·간격·타이포그래피를 여기서만 관리
// → 피그마 디자인 결과물 반영 시 이 파일만 수정하면 앱 전체에 일괄 적용
export const colors = {
  // 주요 색상
  primary: '#FF8A3D',    // 주황: 주요 액션 버튼, 활성 상태
  secondary: '#1A2B48',  // 네이비: 신뢰감, 주요 텍스트 색상
  accent: '#2ECC71',     // 민트: 캐릭터 인증 배지, 성공 상태

  // 배경
  background: '#F8F9FA', // 앱 기본 배경 (연한 회색)
  surface: '#FFFFFF',    // 카드, 모달 배경

  // 상태 색상
  success: '#28A745',
  warning: '#FFC107',
  error: '#DC3545',
  info: '#17A2B8',

  // 텍스트
  textPrimary: '#1A2B48',
  textSecondary: '#6C757D',
  textDisabled: '#ADB5BD',
  textInverse: '#FFFFFF',

  // 입력창
  inputBackground: '#F1F3F5',

  // 구분선
  border: '#E9ECEF',
};

// 4px 그리드 시스템 - 모든 간격은 이 단위의 배수로 설정
// → 요소 간격이 일관되어 디자인 완성도가 높아짐
export const spacing = {
  xs: 4,   // 아이콘과 텍스트 사이 등 미세 간격
  sm: 8,   // 관련 요소 간 소간격
  md: 16,  // 카드 내부 여백, 요소 간 표준 간격
  lg: 24,  // 섹션 간 구분
  xl: 32,  // 화면 상하단 여백
};

// 타이포그래피 - 용도별로 정의하여 텍스트 크기가 화면 전반에서 일관성 유지
export const typography = {
  screenTitle: { fontSize: 22, fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '600' },
  body:         { fontSize: 15, fontWeight: '400' },
  price:        { fontSize: 20, fontWeight: '700' }, // 토스 스타일 - 숫자는 크고 굵게
  caption:      { fontSize: 13, fontWeight: '400' },
  button:       { fontSize: 16, fontWeight: '600' },
};

export const borderRadius = {
  sm: 8,
  md: 10,
  lg: 12,
};
