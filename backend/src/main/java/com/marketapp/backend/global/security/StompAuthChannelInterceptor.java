package com.marketapp.backend.global.security;

import com.marketapp.backend.global.security.jwt.JwtProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;

// WebSocket(STOMP) 채널에서 JWT를 검증하는 인터셉터
//
// [HTTP 필터와 별도로 WebSocket 인증이 필요한 이유]
// WebSocket 연결(HTTP Upgrade 후)은 HTTP 요청-응답 사이클 밖에서 동작한다.
// JwtAuthenticationFilter는 HTTP 요청마다 실행되지만, WebSocket 연결 후
// STOMP 메시지는 HTTP가 아닌 WebSocket 프레임으로 전달되므로 HTTP 필터가 적용되지 않는다.
// 따라서 ChannelInterceptor를 통해 STOMP CONNECT 시점에 JWT를 별도로 검증해야 한다.
// CONNECT가 성공하면 이후 SEND/SUBSCRIBE는 설정된 principal을 그대로 사용한다.
@Slf4j
@Component
@RequiredArgsConstructor
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private final JwtProvider jwtProvider;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null) return message;

        // CONNECT 프레임에서만 인증 처리 - 연결 시 한 번만 검증
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                log.warn("[WebSocket 인증 실패] Authorization 헤더 없음 또는 형식 오류");
                // 채팅은 로그인 필수 기능이므로 미인증 연결을 명시적으로 차단
                throw new IllegalArgumentException("WebSocket 연결에 Authorization: Bearer {token} 헤더가 필요합니다.");
            }

            String token = authHeader.substring(7);

            if (!jwtProvider.validateToken(token)) {
                log.warn("[WebSocket 인증 실패] JWT 검증 실패");
                throw new IllegalArgumentException("WebSocket 연결에 유효한 JWT 토큰이 필요합니다.");
            }

            Long userId = jwtProvider.getUserId(token);
            String username = jwtProvider.getUsername(token);

            UserPrincipal principal = UserPrincipal.ofToken(userId, username);
            UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());

            // STOMP 세션의 user로 등록 - 이후 @MessageMapping에서 principal.getName()으로 접근 가능
            accessor.setUser(auth);
            log.info("[WebSocket 연결 인증 성공] userId={}", userId);
        }

        return message;
    }
}
