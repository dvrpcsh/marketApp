import axios from 'axios';
import { tokenStorage } from '../utils/tokenStorage';
import { navigationRef } from '../utils/navigationRef';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8080';

const instance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// ── 토큰 재발급 중복 요청 방지 상태 ──────────────────────────────────────────
// 동시에 여러 요청이 401을 받았을 때, refresh를 한 번만 호출하고
// 나머지는 완료될 때까지 대기하도록 하는 큐 패턴
let isRefreshing = false;
let refreshWaiters = []; // (newAccessToken) => void 콜백 목록

const notifyRefreshComplete = (newToken) => {
  refreshWaiters.forEach((cb) => cb(newToken));
  refreshWaiters = [];
};

const waitForRefresh = () =>
  new Promise((resolve) => {
    refreshWaiters.push(resolve);
  });

// ── 요청 인터셉터: 모든 요청에 Access Token 자동 주입 ────────────────────────
// @RequestParam Long userId 방식을 완전히 제거하고,
// 서버는 Authorization 헤더의 JWT에서만 사용자를 식별한다.
instance.interceptors.request.use(
  async (config) => {
    const accessToken = await tokenStorage.getAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── 응답 인터셉터 ─────────────────────────────────────────────────────────────
instance.interceptors.response.use(
  // 성공 응답: 백엔드 공통 구조 { success, message, data } 언래핑
  (response) => {
    const { success, message, data } = response.data;
    if (success) return data;
    return Promise.reject(new Error(message || '요청 처리 중 오류가 발생했습니다.'));
  },

  // 에러 응답: 401(토큰 만료) 시 Refresh Token으로 재발급 후 원본 요청 재시도
  async (error) => {
    const originalRequest = error.config;

    // 401 + 재시도 플래그 없음 + refresh 엔드포인트 자체는 재시도 제외
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/api/auth/refresh')
    ) {
      // 이미 refresh 진행 중이면 완료를 기다렸다가 원본 요청 재시도
      if (isRefreshing) {
        const newToken = await waitForRefresh();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return instance(originalRequest);
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await tokenStorage.getRefreshToken();
        if (!refreshToken) throw new Error('refresh token 없음');

        // Refresh Token으로 새 토큰 쌍 요청 (instance 대신 axios 직접 사용하여 인터셉터 루프 방지)
        const res = await axios.post(`${BASE_URL}/api/auth/refresh`, { refreshToken });
        const { accessToken: newAccess, refreshToken: newRefresh } = res.data.data;

        // 새 토큰 저장 및 대기 중인 요청들에게 통보
        await tokenStorage.updateTokens(newAccess, newRefresh);
        notifyRefreshComplete(newAccess);

        // 원본 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return instance(originalRequest);
      } catch {
        // Refresh 실패 = 세션 완전 만료 → 인증 정보 삭제 후 로그인 화면으로 이동
        // navigationRef를 통해 컴포넌트 외부에서 전역 네비게이션 실행
        await tokenStorage.clearAll();
        notifyRefreshComplete(null);
        if (navigationRef.isReady()) {
          navigationRef.navigate('Login');
        }
        return Promise.reject(new Error('세션이 만료되었습니다. 다시 로그인해주세요.'));
      } finally {
        isRefreshing = false;
      }
    }

    // 그 외 에러: 상태 코드·URL·응답 본문을 로그로 남겨 원인 특정
    const status = error.response?.status;
    const url = error.config?.url;
    if (!error.response) {
      console.error(`[API] 네트워크 오류 - 서버에 연결할 수 없음 (baseURL: ${BASE_URL})`);
      console.error('[API] 체크리스트: 서버 실행 여부 / IP 주소 / 방화벽 / 에뮬레이터는 10.0.2.2');
    } else {
      console.error(`[API] HTTP ${status} 에러 — ${url}`);
      console.error('[API] 응답 본문:', JSON.stringify(error.response.data));
    }
    const serverMessage = error.response?.data?.message;
    return Promise.reject(
      new Error(serverMessage || '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.'),
    );
  },
);

export default instance;
