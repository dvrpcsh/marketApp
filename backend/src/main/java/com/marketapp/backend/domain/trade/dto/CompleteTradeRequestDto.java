package com.marketapp.backend.domain.trade.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 거래 완료 요청 DTO
// sellerId 검증: 오직 판매자 본인만 거래를 완료할 수 있도록 백엔드에서 검증
// JWT 도입 후: sellerId는 @AuthenticationPrincipal에서 자동 추출 → 이 필드 제거 예정
@Getter
@NoArgsConstructor
public class CompleteTradeRequestDto {

    // 판매자 권한 검증용 - JWT 도입 후 토큰에서 자동 추출로 변경 예정
    @NotNull(message = "sellerId는 필수입니다.")
    private Long sellerId;

    @NotNull(message = "buyerId는 필수입니다.")
    private Long buyerId;

    // 거래 완료 시스템 메시지를 채팅방에 전송하기 위한 채팅방 ID
    // null이면 시스템 메시지를 전송하지 않음
    private Long roomId;
}
