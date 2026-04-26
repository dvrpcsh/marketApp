package com.marketapp.backend.domain.user.repository;

import com.marketapp.backend.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    // 회원가입 전 중복 여부만 확인하는 경우 - findBy 대신 existsBy 사용으로 불필요한 데이터 조회 방지
    boolean existsByUsername(String username);

    boolean existsByEmail(String email);
}
