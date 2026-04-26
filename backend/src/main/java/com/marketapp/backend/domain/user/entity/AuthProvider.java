package com.marketapp.backend.domain.user.entity;

// OAuth2 로그인 제공자 구분 Enum
// 추후 소셜 로그인 확장 시 여기에 항목만 추가하면 됨
// KAKAO, NAVER는 국내 서비스 특성상 우선 선정
public enum AuthProvider {
    LOCAL,   // 일반 이메일/비밀번호 회원가입
    GOOGLE,  // 구글 소셜 로그인
    KAKAO,   // 카카오 소셜 로그인
    NAVER    // 네이버 소셜 로그인
}
