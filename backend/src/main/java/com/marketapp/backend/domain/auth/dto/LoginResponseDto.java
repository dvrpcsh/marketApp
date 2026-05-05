package com.marketapp.backend.domain.auth.dto;

import com.marketapp.backend.domain.user.entity.User;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LoginResponseDto {

    private Long userId;
    private String username;
    private String nickname;
    // 짧은 만료 시간(30분)의 API 인증용 토큰
    private String accessToken;
    // 긴 만료 시간(14일)의 Access Token 재발급용 토큰 (DB에 서버 측 보관)
    private String refreshToken;

    public static LoginResponseDto of(User user, String accessToken, String refreshToken) {
        return LoginResponseDto.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .nickname(user.getNickname())
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }
}
