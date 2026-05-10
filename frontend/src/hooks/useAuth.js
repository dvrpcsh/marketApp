import { useCallback } from 'react';
import { Alert } from 'react-native';
import { tokenStorage } from '../utils/tokenStorage';

// 인증이 필요한 액션 실행 전 로그인 여부를 체크하는 커스텀 훅
//
// [설계 의도]
// 비로그인 유저도 조회(마켓 탐색, 커뮤니티 읽기)는 자유롭게 허용하되,
// 쓰기/거래 등 주요 액션에는 로그인을 요구하는 '소프트 게이트' 전략.
// 강제 로그인(로그인 없이 아무것도 못하는 구조)보다 전환율이 높고,
// 사용자가 가치를 먼저 경험한 뒤 가입을 결정할 수 있다.
//
// [사용법]
// const { requireAuth } = useAuth(navigation);
// requireAuth(() => navigation.navigate('WritePost'), '메시지');
export const useAuth = (navigation) => {

  // 로그인 여부를 확인하고 미로그인 시 안내 Alert를 띄운 뒤 LoginScreen으로 이동
  // action : 로그인 상태일 때 즉시 실행할 콜백 (생략 시 체크만 수행)
  // message: Alert 본문 메시지
  // 반환값: 로그인 여부 (boolean)
  const requireAuth = useCallback(async (action, message = '이 기능을 사용하려면 로그인이 필요합니다.') => {
    const token = await tokenStorage.getAccessToken();

    if (!token) {
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
