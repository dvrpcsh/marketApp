package com.marketapp.backend.global.config;

import com.marketapp.backend.global.security.StompAuthChannelInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

// STOMP over WebSocket 설정
// 메시지 흐름: 클라이언트 → /app/chat.send → @MessageMapping → DB 저장 → /topic/room/{id} 브로드캐스트
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    // StompAuthChannelInterceptor: STOMP CONNECT 시 JWT 인증을 수행하는 인터셉터
    // HTTP 레이어 이후 WebSocket 연결에서도 인증이 유지되도록 하는 핵심 컴포넌트
    private final StompAuthChannelInterceptor stompAuthChannelInterceptor;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // /topic: 채팅방 메시지처럼 다수에게 브로드캐스트
        // /queue: 특정 사용자에게 1:1 전달 (추후 개인 알림 시스템에 활용)
        config.enableSimpleBroker("/topic", "/queue");
        // 클라이언트 → 서버 메시지의 prefix
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // React Native 앱: 순수 WebSocket (ws://host/ws)
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*"); // 운영 시 실제 도메인으로 교체

        // 웹 브라우저용: SockJS 폴백 (추후 웹 버전 출시 시 활용)
        registry.addEndpoint("/ws-sockjs")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // 인바운드 채널(클라이언트 → 서버)에 JWT 인증 인터셉터 등록
        // STOMP CONNECT 프레임 수신 시 Bearer 토큰 검증 → 검증 실패 시 연결 차단
        registration.interceptors(stompAuthChannelInterceptor);
    }
}
