package com.marketapp.backend.domain.auth.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// Refresh Token을 DB에 저장하는 엔티티
//
// [순수 JWT의 한계와 DB 저장의 이유]
// JWT는 서버가 토큰을 기억하지 않는 Stateless 방식이라, 발급 후 만료 전 무효화가 불가능하다.
// 즉, 사용자가 로그아웃해도 탈취된 토큰이 만료 시까지 유효한 보안 공백이 생긴다.
// Refresh Token만 DB에 저장하여 서버 측 무효화(로그아웃, 계정 정지)가 가능하게 하되,
// Access Token은 짧은 만료 시간(30분)으로 피해를 최소화하는 이중 전략을 채택한다.
@Entity
@Table(name = "refresh_tokens")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RefreshToken {

    // 사용자당 하나의 Refresh Token만 유지하도록 userId를 PK로 사용
    // 새 로그인 시 기존 토큰을 덮어써 동시 로그인 세션을 1개로 제한 (보안 강화)
    @Id
    private Long userId;

    // 실제 토큰 문자열 - DB 조회로 서버 측 무효화 여부를 확인하는 근거 데이터
    @Column(nullable = false, length = 512)
    private String token;

    // 만료 시간 - 만료된 토큰 정리 배치 작업의 기준값
    @Column(nullable = false)
    private LocalDateTime expiresAt;

    public static RefreshToken create(Long userId, String token, LocalDateTime expiresAt) {
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.userId = userId;
        refreshToken.token = token;
        refreshToken.expiresAt = expiresAt;
        return refreshToken;
    }

    // Token Rotation: Refresh Token 재사용 공격 방지를 위해 재발급 시마다 새 토큰으로 교체
    // 탈취된 구 토큰으로 재발급을 시도하면 DB 조회에서 불일치 → 차단됨
    public void rotate(String newToken, LocalDateTime newExpiresAt) {
        this.token = newToken;
        this.expiresAt = newExpiresAt;
    }
}
