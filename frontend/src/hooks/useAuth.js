import { useCallback } from 'react';
import { Alert } from 'react-native';
import { tokenStorage } from '../utils/tokenStorage';

// JWT payload를 디코딩해 토큰 만료 여부를 클라이언트에서 직접 판별
//
// [이 검증이 필요한 이유]
// AsyncStorage에 이전 세션의 토큰이 남아 있으면 "토큰 존재 = 로그인"으로 판단해
// 실제로는 만료된 토큰인데도 인증 가드를 통과해버린다.
// 서버 요청 없이 payload의 exp(만료 시각)를 확인해 만료 토큰을 즉시 걸러낸다.
const isTokenExpired = (token) => {
  try {
    // JWT는 header.payload.signature 구조 - payload만 Base64URL 디코딩
    const payloadB64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(payloadB64));
    // exp는 Unix 초 단위 → ms 단위로 변환 후 현재 시각과 비교
    return exp * 1000 < Date.now();
  } catch {
    return true; // 파싱 실패(형식 불량) 시 만료로 처리
  }
};

// 인증이 필요한 액션 실행 전 로그인 여부를 체크하는 커스텀 훅
//
// [설계 의도]
// 비로그인 유저도 조회(마켓 탐색, 커뮤니티 읽기)는 자유롭게 허용하되,
// 쓰기/거래 등 주요 액션에는 로그인을 요구하는 '소프트 게이트' 전략.
//
// [사용법]
// const { requireAuth } = useAuth(navigation);
// requireAuth(() => navigation.navigate('WritePost'), '메시지');
export const useAuth = (navigation) => {

  // 로그인 여부를 확인하고 미로그인(또는 만료) 시 안내 Alert 후 LoginScreen으로 이동
  // action : 로그인 상태일 때 즉시 실행할 콜백
  // message: Alert 본문 메시지
  const requireAuth = useCallback(async (action, message = '이 기능을 사용하려면 로그인이 필요합니다.') => {
    const token = await tokenStorage.getAccessToken();

    // 토큰 없음 또는 만료된 토큰 → 로그인 필요
    const isAuthenticated = token && !isTokenExpired(token);

    if (!isAuthenticated) {
      // 만료된 잔류 토큰은 즉시 정리해 다음 체크도 정확하게 동작하도록 함
      if (token) await tokenStorage.clearAll();

      Alert.alert(
        '로그인이 필요합니다',
        message,
        [
          { text: '취소', style: 'cancel' },
          {
            text: '로그인하기',
            onPress: () => navigation.navigate('Login'),
          },
        ],
      );
      return false;
    }

    action?.();
    return true;
  }, [navigation]);

  return { requireAuth };
};
