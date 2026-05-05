package com.marketapp.backend.domain.user.service;

import com.marketapp.backend.domain.auth.service.EmailVerificationService;
import com.marketapp.backend.domain.user.dto.SignUpRequestDto;
import com.marketapp.backend.domain.user.dto.UserProfileResponseDto;
import com.marketapp.backend.domain.user.entity.User;
import com.marketapp.backend.domain.user.repository.UserRepository;
import com.marketapp.backend.global.exception.BusinessException;
import com.marketapp.backend.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailVerificationService emailVerificationService;

    // 일반(LOCAL) 회원가입
    // username과 email 중복 여부를 각각 검증해 사용자가 어떤 항목이 중복인지 알 수 있도록 처리
    @Transactional
    public UserProfileResponseDto signUp(SignUpRequestDto requestDto) {
        // TODO: 이메일 인증 재활성화 시 아래 주석 해제
        // if (!emailVerificationService.isVerified(requestDto.getEmail())) {
        //     throw new BusinessException(ErrorCode.EMAIL_NOT_VERIFIED);
        // }
        if (userRepository.existsByUsername(requestDto.getUsername())) {
            throw new BusinessException(ErrorCode.USERNAME_ALREADY_EXISTS);
        }
        if (userRepository.existsByNickname(requestDto.getNickname())) {
            throw new BusinessException(ErrorCode.NICKNAME_ALREADY_EXISTS);
        }
        if (userRepository.existsByEmail(requestDto.getEmail())) {
            throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        User user = User.builder()
                .username(requestDto.getUsername())
                .password(passwordEncoder.encode(requestDto.getPassword()))
                .nickname(requestDto.getNickname())
                .email(requestDto.getEmail())
                .build();

        // TODO: 이메일 인증 재활성화 시 아래 주석 해제
        // emailVerificationService.consumeVerification(requestDto.getEmail());
        return UserProfileResponseDto.from(userRepository.save(user));
    }

    public void checkNicknameDuplicate(String nickname) {
        if (userRepository.existsByNickname(nickname)) {
            throw new BusinessException(ErrorCode.NICKNAME_ALREADY_EXISTS);
        }
    }

    public void checkEmailDuplicate(String email) {
        if (userRepository.existsByEmail(email)) {
            throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }
    }

    // 사용자 프로필 단건 조회
    // 추후 JWT 도입 시 본인 프로필만 조회 가능하도록 Security 레이어에서 추가 제어 예정
    public UserProfileResponseDto getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        return UserProfileResponseDto.from(user);
    }

    // [OAuth2 확장 예정] 소셜 로그인 진입점 껍데기
    // 실제 구현 시: Authorization Code → 제공자 서버에서 사용자 정보 획득 → DB 저장 또는 기존 계정 연동
    public UserProfileResponseDto processOAuth2Login(String provider, String oAuth2UserId) {
        // TODO: OAuth2 제공자별 UserInfo 조회 및 신규 회원가입/기존 계정 로그인 분기 처리
        throw new UnsupportedOperationException("OAuth2 로그인은 추후 구현 예정입니다.");
    }
}
