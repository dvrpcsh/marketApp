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
    // SYSTEM 타입 메시지의 경우 senderId = 0L (시스템 발신 표시)
    @Column(nullable = false)
    private Long senderId;

    // 메시지 본문 - TEXT 타입으로 500자 이상도 수용 가능
    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    // 메시지 종류 - NORMAL(일반 말풍선) vs SYSTEM(거래 완료 등 중앙 배너)
    // 프론트엔드가 이 값을 보고 렌더링 방식을 분기 처리
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ChatMessageType type = ChatMessageType.NORMAL;

    public static ChatMessage create(ChatRoom room, Long senderId, String message) {
        return ChatMessage.builder()
                .room(room)
                .senderId(senderId)
                .message(message)
                .build();
    }

    // 거래 완료 등 서비스 이벤트 알림용 시스템 메시지 생성
    // senderId = 0L: 어떤 특정 사용자가 아닌 시스템이 발신자임을 표시
    public static ChatMessage createSystemMessage(ChatRoom room, String message) {
        return ChatMessage.builder()
                .room(room)
                .senderId(0L)
                .message(message)
                .type(ChatMessageType.SYSTEM)
                .build();
    }
}
