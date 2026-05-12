package com.marketapp.backend.global.config;

import com.marketapp.backend.global.security.jwt.JwtAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

// Spring Security 필터 체인 설정
//
// [전략: 최소 권한 원칙 (Principle of Least Privilege)]
// MVP 단계에서 개발 편의를 위해 열어뒀던 permitAll() 범위를 최소화한다.
// 명시적으로 허용한 경로 외에는 모두 JWT 인증을 강제하여,
// 새로운 API가 추가되어도 기본적으로 인증이 필요한 안전한 상태를 유지한다.
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    // JwtAuthenticationFilter: UsernamePasswordAuthenticationFilter 앞에 위치
    // 모든 요청에서 Bearer 토큰을 추출·검증하여 SecurityContext에 인증 정보를 설정한다
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // REST API 서버이므로 CSRF 비활성화 (세션 쿠키 미사용, Bearer Token 방식)
                .csrf(AbstractHttpConfigurer::disable)
                // JWT 기반 Stateless - 서버가 세션을 생성·유지하지 않음
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // ── 인증 불필요 (공개 엔드포인트) ──────────────────────────────
                        // 회원가입·로그인·토큰 재발급은 인증 전 단계이므로 허용
                        .requestMatchers(HttpMethod.POST,
                                "/api/users/signup",
                                "/api/auth/login",
                                "/api/auth/refresh",
                                "/api/auth/email/send",
                                "/api/auth/email/verify").permitAll()
                        // 닉네임·이메일 중복 확인은 회원가입 전 단계이므로 인증 불필요
                        .requestMatchers(HttpMethod.GET,
                                "/api/users/check-nickname",
                                "/api/users/check-email").permitAll()
                        // 매물 조회는 비회원도 시세 확인을 위해 허용
                        .requestMatchers(HttpMethod.GET, "/api/items", "/api/items/**").permitAll()
                        // 커뮤니티 조회는 비회원도 허용 (쓰기·수정·삭제는 아래에서 인증 강제)
                        .requestMatchers(HttpMethod.GET, "/api/posts", "/api/posts/**").permitAll()
                        // WebSocket 핸드셰이크(HTTP Upgrade)는 이 필터를 통과해야 하므로 허용
                        // 실제 WebSocket 연결 후 인증은 StompAuthChannelInterceptor에서 처리
                        .requestMatchers("/ws/**", "/ws-sockjs/**").permitAll()
                        // ── 인증 필요 (그 외 모든 요청) ─────────────────────────────────
                        // 매물 등록·거래 완료, 채팅, 게시글 쓰기·수정·삭제, 로그아웃 등
                        .anyRequest().authenticated()
                )
                // JWT 필터를 Spring Security 기본 인증 필터 앞에 삽입
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                // JWT 만료 시 AnonymousAuthenticationToken으로 폴백 → AccessDeniedException(403) 발생
                // 익명(= 실질적 미인증) 상태에서 거부된 경우는 401로 변환하여 프론트 refresh 인터셉터가 동작하게 함
                .exceptionHandling(ex -> ex
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                            if (auth == null || auth instanceof AnonymousAuthenticationToken) {
                                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized");
                            } else {
                                response.sendError(HttpServletResponse.SC_FORBIDDEN, "Forbidden");
                            }
                        })
                );

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
