package com.marketapp.backend.domain.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class TokenRefreshResponseDto {

    // 새로 발급된 Access Token
    private String accessToken;
    // 교체된 Refresh Token (Token Rotation)
    private String refreshToken;
}
