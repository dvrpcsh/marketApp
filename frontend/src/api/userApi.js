import instance from './instance';
import { tokenStorage } from '../utils/tokenStorage';

// 회원가입 - SignUpScreen 폼 제출 시 호출
export const signUp = (userData) => instance.post('/api/users/signup', userData);

// 로그인 - 성공 시 Access/Refresh Token과 userId를 로컬 저장소에 자동 저장
export const login = async (username, password) => {
  const data = await instance.post('/api/auth/login', { username, password });
  // 이후 모든 API 요청에 자동으로 토큰이 첨부됨 (instance 요청 인터셉터에서 처리)
  await tokenStorage.saveLoginData(data.userId, data.accessToken, data.refreshToken);
  return data;
};

// 로그아웃 - 서버 측 Refresh Token 삭제 후 로컬 저장소 초기화
export const logout = async () => {
  try {
    await instance.post('/api/auth/logout');
  } finally {
    // 서버 호출 실패하더라도 로컬 토큰은 반드시 삭제
    await tokenStorage.clearAll();
  }
};

// 사용자 프로필 조회 - MyPageScreen에서 본인 정보 표시 시 호출
export const fetchUserProfile = (userId) => instance.get(`/api/users/${userId}`);
