package com.marketapp.backend.global.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

// STOMP over WebSocket 설정
// 메시지 흐름: 클라이언트 → /app/chat.send → @MessageMapping → DB 저장 → /topic/room/{id} 브로드캐스트
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // 인메모리 브로커 활성화
        // /topic: 채팅방 메시지처럼 다수에게 브로드캐스트
        // /queue: 특정 사용자에게 1:1 전달 (추후 개인 알림 시스템에 활용)
        config.enableSimpleBroker("/topic", "/queue");

        // 클라이언트 → 서버 메시지의 prefix
        // @MessageMapping("/chat.send") → 실제 구독 목적지: /app/chat.send
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // React Native 앱용: 네이티브 WebSocket으로 직접 연결 (ws://host:port/ws)
        // SockJS 없이 순수 WebSocket 프로토콜 사용 - React Native의 전역 WebSocket API 활용
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*"); // 개발 환경 전 도메인 허용, 운영 시 실제 도메인으로 교체

        // 웹 브라우저 클라이언트용: SockJS 폴백 지원 (추후 웹 버전 출시 시 활용)
        registry.addEndpoint("/ws-sockjs")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
}
