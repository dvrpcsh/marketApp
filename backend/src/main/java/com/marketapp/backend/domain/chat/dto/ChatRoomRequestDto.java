package com.marketapp.backend.domain.chat.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

// "채팅으로 거래하기" 버튼 클릭 시 채팅방 생성/입장 요청 DTO
//
// [senderId 제거 이유]
// 기존에는 클라이언트가 senderId를 요청 바디에 포함했으나,
// 이는 구매자가 타인의 ID로 채팅방을 개설하는 사칭 공격이 가능한 취약점이었다.
// JWT 도입 후 senderId는 @AuthenticationPrincipal에서 서버가 직접 추출하므로
// 이 DTO에서 제거하여 클라이언트 위조 가능성을 원천 차단한다.
@Getter
@NoArgsConstructor
public class ChatRoomRequestDto {

    @NotNull(message = "receiverId는 필수입니다.")
    private Long receiverId;

    @NotNull(message = "itemId는 필수입니다.")
    private Long itemId;
}
