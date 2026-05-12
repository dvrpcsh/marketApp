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

    // senderId는 STOMP CONNECT 시 설정된 JWT Principal에서 서버가 직접 추출
    // 클라이언트 전달값을 신뢰하면 사칭이 가능하므로 DTO에서 제거

    @NotBlank(message = "메시지 내용은 비어있을 수 없습니다.")
    private String message;

    private ChatMessageType type = ChatMessageType.NORMAL;
}
