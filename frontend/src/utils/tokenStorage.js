import AsyncStorage from '@react-native-async-storage/async-storage';

// AsyncStorage 키값을 상수로 중앙 관리하여 오타에 의한 버그 방지
const KEYS = {
  ACCESS_TOKEN: '@marketapp/access_token',
  REFRESH_TOKEN: '@marketapp/refresh_token',
  USER_ID: '@marketapp/user_id',
};

// 토큰 저장/조회/삭제를 담당하는 유틸리티 모듈
// AsyncStorage는 비동기이므로 모든 메서드가 Promise를 반환함
export const tokenStorage = {
  // 로그인 성공 시 Access + Refresh Token과 userId를 한 번에 저장
  saveLoginData: async (userId, accessToken, refreshToken) => {
    await AsyncStorage.multiSet([
      [KEYS.USER_ID, String(userId)],
      [KEYS.ACCESS_TOKEN, accessToken],
      [KEYS.REFRESH_TOKEN, refreshToken],
    ]);
  },

  // Access Token 갱신 시 두 토큰만 교체 (userId는 유지)
  updateTokens: async (accessToken, refreshToken) => {
    await AsyncStorage.multiSet([
      [KEYS.ACCESS_TOKEN, accessToken],
      [KEYS.REFRESH_TOKEN, refreshToken],
    ]);
  },

  getAccessToken: () => AsyncStorage.getItem(KEYS.ACCESS_TOKEN),
  getRefreshToken: () => AsyncStorage.getItem(KEYS.REFRESH_TOKEN),
  getUserId: async () => {
    const id = await AsyncStorage.getItem(KEYS.USER_ID);
    return id ? Number(id) : null;
  },

  // 로그아웃 시 모든 인증 데이터 일괄 삭제
  clearAll: () => AsyncStorage.multiRemove(Object.values(KEYS)),
};
