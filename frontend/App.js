import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';

// 앱 진입점 - 네비게이션 구조 마운트와 전역 StatusBar 설정만 담당
// 비즈니스 로직과 UI는 각 화면 컴포넌트로 완전히 분리
export default function App() {
  return (
    <>
      <AppNavigator />
      <StatusBar style="dark" />
    </>
  );
}
