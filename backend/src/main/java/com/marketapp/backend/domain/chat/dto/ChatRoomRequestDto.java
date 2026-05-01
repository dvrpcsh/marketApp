package com.marketapp.backend.domain.chat.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

// "채팅으로 거래하기" 버튼 클릭 시 채팅방 생성/입장 요청
// senderId는 JWT 도입 후 토큰에서 자동 추출 예정 - 현재는 요청 바디에 포함하여 MVP 테스트
@Getter
@NoArgsConstructor
public class ChatRoomRequestDto {

    @NotNull(message = "senderId는 필수입니다.")
    private Long senderId;

    @NotNull(message = "receiverId는 필수입니다.")
    private Long receiverId;

    @NotNull(message = "itemId는 필수입니다.")
    private Long itemId;
}
