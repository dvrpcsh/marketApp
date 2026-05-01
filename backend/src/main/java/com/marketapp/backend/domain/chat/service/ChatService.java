package com.marketapp.backend.domain.chat.service;

import com.marketapp.backend.domain.chat.dto.*;
import com.marketapp.backend.domain.chat.entity.ChatMessage;
import com.marketapp.backend.domain.chat.entity.ChatRoom;
import com.marketapp.backend.domain.chat.repository.ChatMessageRepository;
import com.marketapp.backend.domain.chat.repository.ChatRoomRepository;
import com.marketapp.backend.global.exception.BusinessException;
import com.marketapp.backend.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final SimpMessagingTemplate messagingTemplate;

    // "채팅으로 거래하기" 버튼 클릭 시 호출
    // 기존 채팅방이 있으면 반환, 없으면 신규 생성 - 중복 방 생성 방지
    @Transactional
    public ChatRoomResponseDto findOrCreateRoom(ChatRoomRequestDto requestDto) {
        return chatRoomRepository
                .findExistingRoom(requestDto.getSenderId(), requestDto.getReceiverId(), requestDto.getItemId())
                .map(ChatRoomResponseDto::from)
                .orElseGet(() -> {
                    ChatRoom newRoom = ChatRoom.create(
                            requestDto.getSenderId(),
                            requestDto.getReceiverId(),
                            requestDto.getItemId()
                    );
                    return ChatRoomResponseDto.from(chatRoomRepository.save(newRoom));
                });
    }

    // STOMP @MessageMapping에서 수신한 메시지를 DB에 영속화
    // 저장 후 컨트롤러가 SimpMessagingTemplate으로 구독자에게 브로드캐스트
    @Transactional
    public ChatMessageResponseDto saveMessage(ChatMessageRequestDto requestDto) {
        ChatRoom room = chatRoomRepository.findById(requestDto.getRoomId())
                .orElseThrow(() -> new BusinessException(ErrorCode.CHAT_ROOM_NOT_FOUND));

        ChatMessage message = ChatMessage.create(room, requestDto.getSenderId(), requestDto.getMessage());
        return ChatMessageResponseDto.from(chatMessageRepository.save(message));
    }

    // 거래 완료 등 서비스 이벤트를 채팅방에 시스템 메시지로 알림
    // DB 영속화 + STOMP 브로드캐스트를 한 번에 처리
    // → 거래 완료 API에서 호출하여 양쪽 참여자가 동시에 알림을 받도록 설계
    @Transactional
    public void createAndBroadcastSystemMessage(Long roomId, String message) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CHAT_ROOM_NOT_FOUND));

        ChatMessage systemMessage = ChatMessage.createSystemMessage(room, message);
        ChatMessageResponseDto dto = ChatMessageResponseDto.from(chatMessageRepository.save(systemMessage));

        // 채팅방 구독자 전원에게 시스템 메시지 즉시 전달
        messagingTemplate.convertAndSend("/topic/room/" + roomId, dto);
    }

    // 채팅방 입장 시 이전 대화 내역 전체 조회 (오래된 순)
    @Transactional(readOnly = true)
    public List<ChatMessageResponseDto> getMessages(Long roomId) {
        chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CHAT_ROOM_NOT_FOUND));

        return chatMessageRepository.findByRoomIdOrderByCreatedAtAsc(roomId)
                .stream()
                .map(ChatMessageResponseDto::from)
                .collect(Collectors.toList());
    }

    // 사용자가 참여 중인 채팅방 목록 조회 (채팅 탭 목록 화면)
    @Transactional(readOnly = true)
    public List<ChatRoomResponseDto> getRoomsByUserId(Long userId) {
        return chatRoomRepository.findRoomsByUserId(userId)
                .stream()
                .map(ChatRoomResponseDto::from)
                .collect(Collectors.toList());
    }
}
