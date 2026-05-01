// 서버 연결 주소 설정
// Android 에뮬레이터: 10.0.2.2 = 호스트 PC의 localhost를 가리키는 가상 주소
// iOS 시뮬레이터: localhost 사용 가능
// 실기기 테스트: 개발 서버의 실제 LAN IP 주소로 교체 필요
const SERVER_HOST = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8080';

// WebSocket 주소: http → ws 프로토콜로 변환
// React Native의 전역 WebSocket API는 ws:// / wss:// 스킴만 지원
export const WS_BASE_URL = SERVER_HOST.replace(/^http/, 'ws');
