package com.marketapp.backend.global.security;

import com.marketapp.backend.domain.user.entity.User;
import com.marketapp.backend.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

// 로그인 시 Spring Security가 사용자 자격 증명을 확인하기 위해 호출하는 서비스
// JwtFilter에서는 이 서비스를 사용하지 않고 토큰 클레임에서 직접 주체를 구성 (DB hit 방지)
// 이 서비스는 오직 로그인(AuthService)에서만 호출됨
@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + username));
        return UserPrincipal.from(user);
    }
}
