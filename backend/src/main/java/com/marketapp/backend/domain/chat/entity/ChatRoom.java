package com.marketapp.backend.domain.chat.entity;

import com.marketapp.backend.global.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

// 1:1 채팅방 엔티티 - senderId(구매 희망자)와 receiverId(판매자) + itemId로 고유하게 식별
// 동일한 두 사용자가 동일 매물에 대해 여러 번 채팅방을 만들지 않도록 서비스 레이어에서 중복 방지
@Entity
@Table(name = "chat_rooms", indexes = {
        @Index(name = "idx_chat_room_item", columnList = "itemId"),
        @Index(name = "idx_chat_room_participants", columnList = "senderId, receiverId, itemId")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class ChatRoom extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 채팅을 먼저 시작한 사용자 (구매 희망자)
    @Column(nullable = false)
    private Long senderId;

    // 채팅을 받는 사용자 (판매자)
    @Column(nullable = false)
    private Long receiverId;

    // 어떤 매물에 대한 거래인지 식별 - 같은 두 사용자 사이에도 매물별로 독립된 방이 생성됨
    @Column(nullable = false)
    private Long itemId;

    public static ChatRoom create(Long senderId, Long receiverId, Long itemId) {
        return ChatRoom.builder()
                .senderId(senderId)
                .receiverId(receiverId)
                .itemId(itemId)
                .build();
    }
}
