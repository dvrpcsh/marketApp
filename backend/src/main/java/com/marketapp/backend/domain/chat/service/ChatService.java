package com.marketapp.backend.domain.chat.service;

import com.marketapp.backend.domain.chat.dto.*;
import com.marketapp.backend.domain.chat.entity.ChatMessage;
import com.marketapp.backend.domain.chat.entity.ChatRoom;
import com.marketapp.backend.domain.chat.repository.ChatMessageRepository;
import com.marketapp.backend.domain.chat.repository.ChatRoomRepository;
import com.marketapp.backend.global.exception.BusinessException;
import com.marketapp.backend.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final SimpMessagingTemplate messagingTemplate;

    // "채팅으로 거래하기" 클릭 시 호출
    // senderId는 JWT 토큰에서 추출하여 파라미터로 전달 - DTO에서 제거하여 사칭 방지
    @Transactional
    public ChatRoomResponseDto findOrCreateRoom(Long senderId, ChatRoomRequestDto requestDto) {
        log.info("[채팅방 생성/입장] senderId={}, receiverId={}, itemId={}",
                senderId, requestDto.getReceiverId(), requestDto.getItemId());

        return chatRoomRepository
                .findExistingRoom(senderId, requestDto.getReceiverId(), requestDto.getItemId())
                .map(ChatRoomResponseDto::from)
                .orElseGet(() -> {
                    ChatRoom newRoom = ChatRoom.create(
                            senderId,
                            requestDto.getReceiverId(),
                            requestDto.getItemId()
                    );
                    ChatRoomResponseDto dto = ChatRoomResponseDto.from(chatRoomRepository.save(newRoom));
                    log.info("[채팅방 신규 생성] roomId={}", dto.getRoomId());
                    return dto;
                });
    }

    @Transactional
    public ChatMessageResponseDto saveMessage(ChatMessageRequestDto requestDto, Long senderId) {
        ChatRoom room = chatRoomRepository.findById(requestDto.getRoomId())
                .orElseThrow(() -> new BusinessException(ErrorCode.CHAT_ROOM_NOT_FOUND));

        ChatMessage message = ChatMessage.create(room, senderId, requestDto.getMessage());
        return ChatMessageResponseDto.from(chatMessageRepository.save(message));
    }

    @Transactional
    public void createAndBroadcastSystemMessage(Long roomId, String message) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CHAT_ROOM_NOT_FOUND));

        ChatMessage systemMessage = ChatMessage.createSystemMessage(room, message);
        ChatMessageResponseDto dto = ChatMessageResponseDto.from(chatMessageRepository.save(systemMessage));
        messagingTemplate.convertAndSend("/topic/room/" + roomId, dto);
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponseDto> getMessages(Long roomId) {
        chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CHAT_ROOM_NOT_FOUND));

        return chatMessageRepository.findByRoomIdOrderByCreatedAtAsc(roomId)
                .stream()
                .map(ChatMessageResponseDto::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ChatRoomResponseDto> getRoomsByUserId(Long userId) {
        return chatRoomRepository.findRoomsByUserId(userId)
                .stream()
                .map(ChatRoomResponseDto::from)
                .collect(Collectors.toList());
    }
}
