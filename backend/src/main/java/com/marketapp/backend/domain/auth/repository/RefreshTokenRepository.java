package com.marketapp.backend.domain.auth.repository;

import com.marketapp.backend.domain.auth.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    // 토큰 문자열로 조회 - 서버 측 무효화 확인 시 사용
    // (토큰 서명은 유효해도 로그아웃으로 DB에서 삭제됐으면 재발급 차단)
    Optional<RefreshToken> findByToken(String token);
}
