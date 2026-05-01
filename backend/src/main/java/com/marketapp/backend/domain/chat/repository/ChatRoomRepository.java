package com.marketapp.backend.domain.chat.repository;

import com.marketapp.backend.domain.chat.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {

    // 양방향 탐색: A→B로 개설했든 B→A로 개설했든 같은 방을 찾아냄
    // → "채팅으로 거래하기" 버튼을 여러 번 눌러도 기존 방으로 입장됨
    @Query("""
            SELECT cr FROM ChatRoom cr
            WHERE cr.itemId = :itemId
              AND (
                (cr.senderId = :userA AND cr.receiverId = :userB)
                OR
                (cr.senderId = :userB AND cr.receiverId = :userA)
              )
            """)
    Optional<ChatRoom> findExistingRoom(
            @Param("userA") Long userA,
            @Param("userB") Long userB,
            @Param("itemId") Long itemId
    );

    // 특정 사용자가 참여 중인 모든 채팅방 목록 - 채팅 탭 목록 화면에서 사용
    @Query("""
            SELECT cr FROM ChatRoom cr
            WHERE cr.senderId = :userId OR cr.receiverId = :userId
            ORDER BY cr.updatedAt DESC
            """)
    List<ChatRoom> findRoomsByUserId(@Param("userId") Long userId);
}
