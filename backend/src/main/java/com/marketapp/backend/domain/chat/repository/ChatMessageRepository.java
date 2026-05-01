package com.marketapp.backend.domain.chat.repository;

import com.marketapp.backend.domain.chat.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    // 채팅방의 전체 메시지를 오래된 순으로 조회
    // 프론트엔드 FlatList(inverted)에서 reverse() 처리하여 최신 메시지를 하단에 표시
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.room.id = :roomId ORDER BY cm.createdAt ASC")
    List<ChatMessage> findByRoomIdOrderByCreatedAtAsc(@Param("roomId") Long roomId);
}
