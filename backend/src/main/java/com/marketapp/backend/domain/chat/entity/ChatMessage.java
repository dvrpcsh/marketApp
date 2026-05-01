package com.marketapp.backend.domain.chat.entity;

import com.marketapp.backend.global.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

// 채팅 메시지 엔티티 - 특정 채팅방(ChatRoom)에 속한 개별 메시지
// 현재는 텍스트 메시지만 지원, 이미지/파일 URL은 추후 컬럼 추가 예정
@Entity
@Table(name = "chat_messages", indexes = {
        @Index(name = "idx_chat_message_room", columnList = "room_id")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class ChatMessage extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 어떤 채팅방의 메시지인지 - LAZY 로딩으로 N+1 방지
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private ChatRoom room;

    // 메시지를 전송한 사용자 ID (JWT 도입 후 토큰에서 자동 추출 예정)
    @Column(nullable = false)
    private Long senderId;

    // 메시지 본문 - TEXT 타입으로 500자 이상도 수용 가능
    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    public static ChatMessage create(ChatRoom room, Long senderId, String message) {
        return ChatMessage.builder()
                .room(room)
                .senderId(senderId)
                .message(message)
                .build();
    }
}
