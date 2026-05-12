package com.marketapp.backend.domain.chat.controller;

import com.marketapp.backend.domain.chat.dto.*;
import com.marketapp.backend.domain.chat.service.ChatService;
import com.marketapp.backend.global.common.ResponseDto;
import com.marketapp.backend.global.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;


// REST API: 채팅방 생성/조회, 메시지 히스토리 조회
// STOMP: 실시간 메시지 수신 및 브로드캐스트
@RestController
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    // [REST] 채팅방 생성 또는 기존 방 입장
    // senderId를 @AuthenticationPrincipal에서 추출하여 DTO에서 제거 - 사칭 공격 방지
    @PostMapping("/api/chats/rooms")
    public ResponseEntity<ResponseDto<ChatRoomResponseDto>> findOrCreateRoom(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ChatRoomRequestDto requestDto) {
        ChatRoomResponseDto response = chatService.findOrCreateRoom(principal.getId(), requestDto);
        return ResponseEntity.ok(ResponseDto.success(response));
    }

    // [REST] 사용자가 참여 중인 채팅방 목록 조회 (채팅 탭)
    // 기존 @RequestParam Long userId 제거 - JWT 토큰에서 서버가 직접 userId를 추출
    @GetMapping("/api/chats/rooms")
    public ResponseEntity<ResponseDto<List<ChatRoomResponseDto>>> getRooms(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<ChatRoomResponseDto> rooms = chatService.getRoomsByUserId(principal.getId());
        return ResponseEntity.ok(ResponseDto.success(rooms));
    }

    // [REST] 채팅방 입장 시 이전 메시지 히스토리 일괄 로드
    @GetMapping("/api/chats/rooms/{roomId}/messages")
    public ResponseEntity<ResponseDto<List<ChatMessageResponseDto>>> getMessages(
            @PathVariable Long roomId) {
        return ResponseEntity.ok(ResponseDto.success(chatService.getMessages(roomId)));
    }

    // [STOMP] 실시간 메시지 수신 및 브로드캐스트
    // StompAuthChannelInterceptor가 CONNECT 시 설정한 Principal에서 senderId 추출
    // 클라이언트 전달값을 사용하지 않으므로 발신자 사칭 불가
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload @Valid ChatMessageRequestDto requestDto, Principal principal) {
        UserPrincipal userPrincipal =
                (UserPrincipal) ((UsernamePasswordAuthenticationToken) principal).getPrincipal();
        ChatMessageResponseDto savedMessage = chatService.saveMessage(requestDto, userPrincipal.getId());
        messagingTemplate.convertAndSend(
                "/topic/room/" + requestDto.getRoomId(),
                savedMessage
        );
    }
}
