import { createNavigationContainerRef } from '@react-navigation/native';

// 컴포넌트 외부(Axios 인터셉터 등)에서 네비게이션을 사용하기 위한 전역 참조
// AppNavigator의 NavigationContainer에 ref로 연결하여 사용한다.
//
// [사용이 필요한 이유]
// Axios 인터셉터는 React 컴포넌트가 아니므로 useNavigation() 훅을 사용할 수 없다.
// 세션이 완전 만료(리프레시 실패)될 때 인터셉터에서 직접 로그인 화면으로 이동시키기 위해 필요.
export const navigationRef = createNavigationContainerRef();
