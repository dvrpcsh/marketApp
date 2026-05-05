package com.marketapp.backend.domain.user.entity;

import com.marketapp.backend.global.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

// 마켓앱의 핵심 주체 - 판매자이자 구매자이며 신뢰 점수를 보유한 사용자
// reliabilityScore 36.5 기본값: 사람의 체온처럼 '정상 기준점'에서 출발하는 신뢰 시스템 설계 의도
@Entity
@Table(name = "users",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = "username"),
                @UniqueConstraint(columnNames = "nickname"),
                @UniqueConstraint(columnNames = "email")
        })
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 로그인에 사용하는 고유 식별자 - email과 분리하여 ID 변경 없이 이메일 변경 가능
    @Column(nullable = false, length = 50)
    private String username;

    // OAuth2 로그인 사용자는 비밀번호가 없으므로 nullable 허용
    @Column
    private String password;

    @Column(nullable = false, length = 50)
    private String nickname;

    @Column(nullable = false, length = 100)
    private String email;

    @Column(length = 20)
    private String phoneNumber;

    // 휴대폰 인증 완료 여부 - 추후 인증 등급 시스템의 첫 번째 조건으로 활용 예정
    @Column(nullable = false)
    @Builder.Default
    private boolean phoneVerified = false;

    // 신뢰 점수: 36.5 기본값 → 거래 성공 시 상승, 분쟁/취소 시 하락하는 동적 지표
    // 캐릭터 인증 시스템과 연동하여 인증 완료 시 추가 점수 부여 예정
    @Column(nullable = false)
    @Builder.Default
    private double reliabilityScore = 36.5;

    // 완료된 거래 횟수 - 프로필 신뢰도 지표, 거래 경험을 숫자로 증명
    @Column(nullable = false)
    @Builder.Default
    private int tradeCount = 0;

    // 소셜 로그인 제공자 - LOCAL이면 일반 회원가입, 그 외는 OAuth2 로그인
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private AuthProvider provider = AuthProvider.LOCAL;

    // 거래 완료 후 신뢰 점수 업데이트
    // 필드 직접 접근 대신 의미 있는 메서드로 캡슐화하여 도메인 의도 명확화
    public void updateReliabilityScore(double delta) {
        // 신뢰 점수는 음수가 될 수 없음 - 최하 0으로 고정
        this.reliabilityScore = Math.max(0, this.reliabilityScore + delta);
    }

    public void incrementTradeCount() {
        this.tradeCount++;
    }

    // 휴대폰 인증 완료 처리 - 번호 저장과 인증 상태 변경을 원자적으로 처리
    public void verifyPhone(String phoneNumber) {
        this.phoneNumber = phoneNumber;
        this.phoneVerified = true;
    }
}
