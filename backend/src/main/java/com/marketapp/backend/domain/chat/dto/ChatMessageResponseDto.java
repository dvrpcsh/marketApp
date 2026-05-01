package com.marketapp.backend.domain.chat.dto;

import com.marketapp.backend.domain.chat.entity.ChatMessage;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

// STOMP 브로드캐스트 및 REST 히스토리 조회 모두에서 사용하는 메시지 응답 DTO
@Getter
@Builder
public class ChatMessageResponseDto {

    private Long messageId;
    private Long roomId;
    private Long senderId;
    private String message;
    private LocalDateTime createdAt;

    public static ChatMessageResponseDto from(ChatMessage msg) {
        return ChatMessageResponseDto.builder()
                .messageId(msg.getId())
                .roomId(msg.getRoom().getId())
                .senderId(msg.getSenderId())
                .message(msg.getMessage())
                .createdAt(msg.getCreatedAt())
                .build();
    }
}
