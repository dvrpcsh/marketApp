package com.marketapp.backend.domain.chat.dto;

import com.marketapp.backend.domain.chat.entity.ChatMessageType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

// STOMP @MessageMapping("/chat.send") 으로 수신되는 메시지 DTO
// 클라이언트가 /app/chat.send 로 publish하면 이 DTO로 역직렬화됨
@Getter
@NoArgsConstructor
public class ChatMessageRequestDto {

    @NotNull(message = "roomId는 필수입니다.")
    private Long roomId;

    // JWT 도입 후 토큰에서 자동 추출 예정 - 현재는 클라이언트에서 전달
    @NotNull(message = "senderId는 필수입니다.")
    private Long senderId;

    @NotBlank(message = "메시지 내용은 비어있을 수 없습니다.")
    private String message;

    // 메시지 타입 - 클라이언트에서 명시하지 않으면 NORMAL로 처리
    private ChatMessageType type = ChatMessageType.NORMAL;
}
