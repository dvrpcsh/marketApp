package com.marketapp.backend.global.security.jwt;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

// JWT 토큰의 생성, 파싱, 검증을 전담하는 컴포넌트
// HMAC-SHA256 서명으로 토큰 위변조를 방지
// 토큰 클레임에 userId와 username을 포함하여 DB 조회 없이 인증 주체 식별 가능
@Slf4j
@Component
public class JwtProvider {

    private final SecretKey secretKey;
    private final long accessTokenExpiry;
    private final long refreshTokenExpiry;

    public JwtProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-token-expiry}") long accessTokenExpiry,
            @Value("${jwt.refresh-token-expiry}") long refreshTokenExpiry) {
        // Base64 디코딩된 시크릿으로 HMAC 키 생성 - 환경 변수로 주입되어 소스코드에 노출되지 않음
        this.secretKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
        this.accessTokenExpiry = accessTokenExpiry;
        this.refreshTokenExpiry = refreshTokenExpiry;
    }

    // Access Token 생성 (짧은 유효기간: 30분)
    // 클레임에 userId와 username을 포함하여 DB 재조회 없이 인증 주체 구성 가능
    public String generateAccessToken(Long userId, String username) {
        return buildToken(userId, username, accessTokenExpiry);
    }

    // Refresh Token 생성 (긴 유효기간: 14일)
    // DB에 저장하여 로그아웃 시 무효화 가능 - 순수 JWT의 무효화 불가 문제를 DB 조회로 보완
    public String generateRefreshToken(Long userId, String username) {
        return buildToken(userId, username, refreshTokenExpiry);
    }

    private String buildToken(Long userId, String username, long expiry) {
        Date now = new Date();
        return Jwts.builder()
                .subject(userId.toString())     // 토큰 주체: userId (String)
                .claim("username", username)    // 추가 클레임: DB 재조회 없이 닉네임 표시 목적
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expiry))
                .signWith(secretKey)            // HMAC-SHA256 서명
                .compact();
    }

    // 토큰에서 userId 추출 - 서명 검증 후 클레임에서 읽음
    public Long getUserId(String token) {
        return Long.parseLong(getClaims(token).getSubject());
    }

    public String getUsername(String token) {
        return getClaims(token).get("username", String.class);
    }

    // 토큰 유효성 검증 - 서명 불일치, 만료, 형식 오류를 구분하여 로그 기록
    public boolean validateToken(String token) {
        try {
            getClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            log.warn("만료된 JWT 토큰: {}", maskToken(token));
        } catch (UnsupportedJwtException | MalformedJwtException e) {
            log.warn("유효하지 않은 JWT 토큰 형식: {}", maskToken(token));
        } catch (SecurityException e) {
            log.warn("JWT 서명 검증 실패 - 토큰 위변조 시도 의심: {}", maskToken(token));
        } catch (IllegalArgumentException e) {
            log.warn("JWT 클레임이 비어있음: {}", maskToken(token));
        }
        return false;
    }

    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    // 로그에 토큰 전체가 노출되지 않도록 앞 10자만 표시
    private String maskToken(String token) {
        if (token == null || token.length() < 10) return "[MASKED]";
        return token.substring(0, 10) + "...[MASKED]";
    }
}
