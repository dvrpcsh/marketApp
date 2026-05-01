package com.marketapp.backend.domain.chat.dto;

import com.marketapp.backend.domain.chat.entity.ChatMessage;
import com.marketapp.backend.domain.chat.entity.ChatMessageType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

// STOMP 브로드캐스트 및 REST 히스토리 조회 모두에서 사용하는 메시지 응답 DTO
// type 필드를 통해 프론트엔드가 일반 말풍선(NORMAL)과 시스템 배너(SYSTEM)를 구분하여 렌더링
@Getter
@Builder
public class ChatMessageResponseDto {

    private Long messageId;
    private Long roomId;
    private Long senderId;
    private String message;
    private ChatMessageType type;
    private LocalDateTime createdAt;

    public static ChatMessageResponseDto from(ChatMessage msg) {
        return ChatMessageResponseDto.builder()
                .messageId(msg.getId())
                .roomId(msg.getRoom().getId())
                .senderId(msg.getSenderId())
                .message(msg.getMessage())
                .type(msg.getType())
                .createdAt(msg.getCreatedAt())
                .build();
    }
}
