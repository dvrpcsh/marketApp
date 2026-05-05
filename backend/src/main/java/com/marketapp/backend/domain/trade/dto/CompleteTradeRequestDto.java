package com.marketapp.backend.domain.trade.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 거래 완료 요청 DTO
//
// [sellerId 제거 이유]
// 기존에는 클라이언트가 sellerId를 요청 바디에 담아 전송했으나,
// 이는 구매자가 타인의 userId를 sellerId로 위조하여 권한을 사칭할 수 있는 취약점이었다.
// JWT 도입 후 sellerId는 @AuthenticationPrincipal에서 서버가 직접 추출하므로
// 이 DTO에서 완전히 제거하여 클라이언트 위조 가능성을 원천 차단한다.
@Getter
@NoArgsConstructor
public class CompleteTradeRequestDto {

    @NotNull(message = "buyerId는 필수입니다.")
    private Long buyerId;

    // 거래 완료 시스템 메시지를 채팅방에 전송하기 위한 채팅방 ID (선택값)
    private Long roomId;
}
