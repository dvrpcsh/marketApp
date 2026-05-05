package com.marketapp.backend.domain.auth.service;

import com.marketapp.backend.domain.auth.dto.LoginRequestDto;
import com.marketapp.backend.domain.auth.dto.LoginResponseDto;
import com.marketapp.backend.domain.auth.dto.TokenRefreshResponseDto;
import com.marketapp.backend.domain.auth.entity.RefreshToken;
import com.marketapp.backend.domain.auth.repository.RefreshTokenRepository;
import com.marketapp.backend.domain.user.entity.User;
import com.marketapp.backend.domain.user.repository.UserRepository;
import com.marketapp.backend.global.exception.BusinessException;
import com.marketapp.backend.global.exception.ErrorCode;
import com.marketapp.backend.global.security.jwt.JwtProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtProvider jwtProvider;
    private final PasswordEncoder passwordEncoder;

    @Value("${jwt.refresh-token-expiry}")
    private long refreshTokenExpiryMs;

    // 로그인 처리 - 자격 증명 검증 후 Access/Refresh Token 쌍을 발급
    //
    // [보안 설계 이유]
    // - username/password 불일치 시 동일한 예외(INVALID_CREDENTIALS)를 반환하여
    //   공격자가 "어느 항목이 틀렸는지" 유추하는 Username Enumeration 공격을 방지한다.
    // - Refresh Token을 DB에 저장(upsert)하여 로그아웃 시 서버 측 무효화가 가능하도록 한다.
    @Transactional
    public LoginResponseDto login(LoginRequestDto requestDto) {
        log.info("[로그인 시도] username={}", requestDto.getUsername());

        User user = userRepository.findByUsername(requestDto.getUsername())
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_CREDENTIALS));

        // 탈취한 DB 해시값으로는 로그인 불가 - BCrypt 해시 비교를 통한 평문 비밀번호 검증
        if (!passwordEncoder.matches(requestDto.getPassword(), user.getPassword())) {
            log.warn("[로그인 실패] 비밀번호 불일치 - username={}", requestDto.getUsername());
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }

        String accessToken = jwtProvider.generateAccessToken(user.getId(), user.getUsername());
        String refreshToken = jwtProvider.generateRefreshToken(user.getId(), user.getUsername());
        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(refreshTokenExpiryMs / 1000);

        // Refresh Token DB 저장(upsert): 이미 로그인한 기기가 있으면 덮어써서 단일 세션 유지
        refreshTokenRepository.findById(user.getId())
                .ifPresentOrElse(
                        existing -> existing.rotate(refreshToken, expiresAt),
                        () -> refreshTokenRepository.save(
                                RefreshToken.create(user.getId(), refreshToken, expiresAt))
                );

        log.info("[로그인 성공] userId={}, username={}", user.getId(), user.getUsername());
        return LoginResponseDto.of(user, accessToken, refreshToken);
    }

    // Refresh Token으로 새로운 Access/Refresh Token 쌍 재발급
    //
    // [2단계 검증의 이유]
    // 1단계(JWT 서명 검증)만으로는 로그아웃된 토큰을 차단할 수 없다.
    // 2단계(DB 조회)를 통해 서버가 무효화한 토큰(로그아웃, 계정 정지)을 확실히 차단한다.
    // Token Rotation으로 재발급마다 새 Refresh Token을 발급하여 탈취된 구 토큰의 재사용을 방지한다.
    @Transactional
    public TokenRefreshResponseDto refresh(String requestRefreshToken) {
        // 1단계: JWT 서명/만료 검증
        if (!jwtProvider.validateToken(requestRefreshToken)) {
            throw new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN);
        }

        // 2단계: DB 조회로 서버 측 무효화(로그아웃) 여부 확인
        RefreshToken stored = refreshTokenRepository.findByToken(requestRefreshToken)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN));

        Long userId = jwtProvider.getUserId(requestRefreshToken);
        String username = jwtProvider.getUsername(requestRefreshToken);

        // Token Rotation: 매 재발급 시마다 새 Refresh Token 발급 후 DB 교체
        String newAccessToken = jwtProvider.generateAccessToken(userId, username);
        String newRefreshToken = jwtProvider.generateRefreshToken(userId, username);
        LocalDateTime newExpiresAt = LocalDateTime.now().plusSeconds(refreshTokenExpiryMs / 1000);
        stored.rotate(newRefreshToken, newExpiresAt);

        log.info("[토큰 재발급] userId={}", userId);
        return new TokenRefreshResponseDto(newAccessToken, newRefreshToken);
    }

    // 로그아웃 - DB에서 Refresh Token 삭제
    // JWT는 서버가 직접 만료시킬 수 없으므로, Refresh Token을 제거하여
    // 이후 Access Token 만료 후 재발급을 원천 차단하는 방식으로 로그아웃 구현
    @Transactional
    public void logout(Long userId) {
        refreshTokenRepository.deleteById(userId);
        log.info("[로그아웃] userId={}", userId);
    }
}
