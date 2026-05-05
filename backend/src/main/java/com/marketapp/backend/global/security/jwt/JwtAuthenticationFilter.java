package com.marketapp.backend.global.security.jwt;

import com.marketapp.backend.global.security.UserPrincipal;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

// 모든 HTTP 요청에 한 번씩 실행되는 JWT 인증 필터
//
// [HTTP 레이어 인증이 필요한 이유]
// Spring Security의 기본 인증 방식(세션/폼 로그인)은 REST API와 맞지 않는다.
// JWT를 사용하면 서버가 세션을 유지하지 않아도(Stateless) 토큰만으로 사용자를 식별할 수 있다.
// 이 필터가 UsernamePasswordAuthenticationFilter 앞에 위치하여 모든 요청에서
// Bearer 토큰을 추출·검증한 뒤 SecurityContext에 인증 객체를 설정한다.
// permitAll() 경로도 이 필터를 통과하지만, SecurityContext가 비어있어도 정상 동작한다.
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String token = resolveToken(request);

        if (token != null && jwtProvider.validateToken(token)) {
            Long userId = jwtProvider.getUserId(token);
            String username = jwtProvider.getUsername(token);

            // DB 조회 없이 토큰 클레임에서 직접 인증 주체를 구성
            // 매 요청마다 DB를 조회하면 N배의 쿼리 비용이 발생하므로,
            // 짧은 만료 시간(30분)과 서명 검증으로 보안을 대신한다.
            UserPrincipal principal = UserPrincipal.ofToken(userId, username);
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            // SecurityContextHolder에 인증 정보 등록
            // 이후 @AuthenticationPrincipal 어노테이션으로 컨트롤러에서 주입받을 수 있게 된다
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }

    // Authorization 헤더에서 Bearer 접두사를 제거한 순수 토큰 문자열 추출
    private String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
