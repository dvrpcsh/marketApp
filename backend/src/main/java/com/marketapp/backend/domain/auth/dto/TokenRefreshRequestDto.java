package com.marketapp.backend.domain.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class TokenRefreshRequestDto {

    @NotBlank(message = "refreshToken은 필수입니다.")
    private String refreshToken;
}
