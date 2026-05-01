package com.marketapp.backend.global.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

// MVP 단계 Spring Security 설정
// Stateless(JWT) 구조를 미리 잡아두고, JWT 필터는 추후 여기에 체인으로 추가
// 인증이 필요 없는 공개 API는 명시적으로 permitAll() 처리
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // REST API 서버이므로 CSRF 비활성화 (세션 미사용)
                .csrf(AbstractHttpConfigurer::disable)
                // JWT 기반 Stateless 인증 - 서버가 세션을 관리하지 않음
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // 회원가입은 인증 없이 접근 허용
                        .requestMatchers(HttpMethod.POST, "/api/users/signup").permitAll()
                        // 사용자 프로필 조회 - MVP 테스트용 permitAll (JWT 도입 후 본인 인증 추가)
                        .requestMatchers(HttpMethod.GET, "/api/users/**").permitAll()
                        // 매물 목록/상세 조회는 비회원도 접근 허용 (시세 확인 목적)
                        .requestMatchers(HttpMethod.GET, "/api/items", "/api/items/**").permitAll()
                        // WebSocket 핸드셰이크 엔드포인트 - HTTP Upgrade 요청이므로 Security 통과 필요
                        // /ws: React Native 순수 WebSocket / /ws-sockjs: SockJS 폴백 (웹 클라이언트용)
                        .requestMatchers("/ws/**", "/ws-sockjs/**").permitAll()
                        // 채팅 API - JWT 도입 후 인증 필요로 변경 예정
                        .requestMatchers("/api/chats/**").permitAll()
                        // 거래 완료 API - MVP 테스트용 permitAll, JWT 도입 후 판매자 인증으로 변경
                        .requestMatchers("/api/items/*/complete").permitAll()
                        // 그 외 모든 요청은 인증 필요 (JWT 도입 후 필터에서 토큰 검증)
                        .anyRequest().authenticated()
                );

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
