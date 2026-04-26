package com.marketapp.backend.domain.user.dto;

import com.marketapp.backend.domain.user.entity.AuthProvider;
import com.marketapp.backend.domain.user.entity.User;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

// 사용자 프로필 응답 DTO
// 비밀번호 등 민감 정보는 절대 포함하지 않음
// Entity → DTO 변환 로직을 DTO 자체에 캡슐화 → Service 코드에 변환 반복 제거
@Getter
@Builder
public class UserProfileResponseDto {

    private Long id;
    private String username;
    private String nickname;
    private String email;
    private boolean phoneVerified;
    private double reliabilityScore;
    private int tradeCount;
    private AuthProvider provider;
    private LocalDateTime createdAt;

    public static UserProfileResponseDto from(User user) {
        return UserProfileResponseDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .nickname(user.getNickname())
                .email(user.getEmail())
                .phoneVerified(user.isPhoneVerified())
                .reliabilityScore(user.getReliabilityScore())
                .tradeCount(user.getTradeCount())
                .provider(user.getProvider())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
