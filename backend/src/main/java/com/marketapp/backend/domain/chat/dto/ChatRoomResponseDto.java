package com.marketapp.backend.domain.chat.dto;

import com.marketapp.backend.domain.chat.entity.ChatRoom;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ChatRoomResponseDto {

    private Long roomId;
    private Long senderId;
    private Long receiverId;
    private Long itemId;
    private LocalDateTime createdAt;

    public static ChatRoomResponseDto from(ChatRoom room) {
        return ChatRoomResponseDto.builder()
                .roomId(room.getId())
                .senderId(room.getSenderId())
                .receiverId(room.getReceiverId())
                .itemId(room.getItemId())
                .createdAt(room.getCreatedAt())
                .build();
    }
}
