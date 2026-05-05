package com.marketapp.backend.global.security;

import com.marketapp.backend.domain.user.entity.User;
import lombok.Builder;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

// Spring Security의 인증 주체 - JWT 필터에서 토큰 파싱 후 이 객체를 SecurityContext에 등록
// @AuthenticationPrincipal로 Controller에 주입되어 현재 로그인한 사용자 정보를 DB 재조회 없이 제공
// → 토큰 클레임에서 직접 사용자 정보를 추출하므로 매 요청마다 DB hit 없음
@Getter
@Builder
public class UserPrincipal implements UserDetails {

    private final Long id;
    private final String username;
    // 비밀번호는 토큰 기반 인증에서 필요 없지만 UserDetails 계약상 포함
    private final String password;

    public static UserPrincipal from(User user) {
        return UserPrincipal.builder()
                .id(user.getId())
                .username(user.getUsername())
                .password(user.getPassword())
                .build();
    }

    // 토큰 클레임만으로 주체를 구성할 때 사용 (JwtFilter에서 DB 조회 없이 생성)
    public static UserPrincipal ofToken(Long id, String username) {
        return UserPrincipal.builder()
                .id(id)
                .username(username)
                .password("")
                .build();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_USER"));
    }

    @Override public boolean isAccountNonExpired()  { return true; }
    @Override public boolean isAccountNonLocked()   { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled()             { return true; }
}
