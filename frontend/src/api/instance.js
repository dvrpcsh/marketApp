import axios from 'axios';

// 백엔드 서버 주소 - 환경 변수로 관리하여 로컬/개발/운영 환경 전환을 코드 수정 없이 처리
// Android 에뮬레이터: 10.0.2.2 = 호스트 PC의 localhost를 가리키는 특수 주소
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8080';

const instance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// 응답 인터셉터: 백엔드 공통 응답 구조 { success, message, data }를 자동으로 언래핑
// → 각 API 호출부에서 response.data.data 처럼 중첩 접근하지 않고 바로 데이터 사용 가능
instance.interceptors.response.use(
  (response) => {
    const { success, message, data } = response.data;

    if (success) {
      // 성공: 실제 페이로드만 반환
      return data;
    }

    // success: false - 서버가 비즈니스 오류를 정상 HTTP 상태로 응답한 경우 (예: 아이디 중복)
    return Promise.reject(new Error(message || '요청 처리 중 오류가 발생했습니다.'));
  },
  (error) => {
    // 네트워크 단절 또는 HTTP 4xx/5xx - 서버 메시지 있으면 그대로 전달, 없으면 기본 안내
    const serverMessage = error.response?.data?.message;
    const userMessage = serverMessage || '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.';
    return Promise.reject(new Error(userMessage));
  },
);

export default instance;
