package com.marketapp.backend.domain.auth.controller;

import com.marketapp.backend.domain.auth.dto.LoginRequestDto;
import com.marketapp.backend.domain.auth.dto.LoginResponseDto;
import com.marketapp.backend.domain.auth.dto.TokenRefreshRequestDto;
import com.marketapp.backend.domain.auth.dto.TokenRefreshResponseDto;
import com.marketapp.backend.domain.auth.service.AuthService;
import com.marketapp.backend.global.common.ResponseDto;
import com.marketapp.backend.global.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // 로그인: Access + Refresh Token 쌍 반환
    // SecurityConfig에서 permitAll() 처리하여 인증 없이 접근 가능
    @PostMapping("/login")
    public ResponseEntity<ResponseDto<LoginResponseDto>> login(
            @Valid @RequestBody LoginRequestDto requestDto) {
        return ResponseEntity.ok(
                ResponseDto.success("로그인 성공", authService.login(requestDto)));
    }

    // Access Token 재발급: Refresh Token 검증 후 새 토큰 쌍 반환
    // SecurityConfig에서 permitAll() - 만료된 Access Token으로 호출하므로 인증 불필요
    @PostMapping("/refresh")
    public ResponseEntity<ResponseDto<TokenRefreshResponseDto>> refresh(
            @Valid @RequestBody TokenRefreshRequestDto requestDto) {
        return ResponseEntity.ok(
                ResponseDto.success("토큰 재발급 성공", authService.refresh(requestDto.getRefreshToken())));
    }

    // 로그아웃: DB에서 Refresh Token 삭제하여 서버 측 무효화
    // 인증된 사용자만 호출 가능 - JWT 필터에서 Access Token 검증 후 principal 주입
    @PostMapping("/logout")
    public ResponseEntity<ResponseDto<Void>> logout(
            @AuthenticationPrincipal UserPrincipal principal) {
        authService.logout(principal.getId());
        return ResponseEntity.ok(ResponseDto.success(null));
    }
}
