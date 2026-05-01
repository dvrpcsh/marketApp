package com.marketapp.backend.domain.chat.controller;

import com.marketapp.backend.domain.chat.dto.*;
import com.marketapp.backend.domain.chat.service.ChatService;
import com.marketapp.backend.global.common.ResponseDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// REST API: 채팅방 생성/조회, 메시지 히스토리 조회
// STOMP: 실시간 메시지 수신 및 브로드캐스트
@RestController
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    // STOMP 메시지를 특정 구독 경로로 직접 전송하기 위한 템플릿
    private final SimpMessagingTemplate messagingTemplate;

    // [REST] 채팅방 생성 또는 기존 방 입장
    // ItemDetailScreen의 "채팅으로 거래하기" 버튼에서 POST 호출
    @PostMapping("/api/chats/rooms")
    public ResponseEntity<ResponseDto<ChatRoomResponseDto>> findOrCreateRoom(
            @Valid @RequestBody ChatRoomRequestDto requestDto) {
        ChatRoomResponseDto response = chatService.findOrCreateRoom(requestDto);
        return ResponseEntity.ok(ResponseDto.success(response));
    }

    // [REST] 사용자가 참여 중인 채팅방 목록 조회 (채팅 탭)
    // JWT 도입 후 @AuthenticationPrincipal로 userId 자동 추출 예정
    @GetMapping("/api/chats/rooms")
    public ResponseEntity<ResponseDto<List<ChatRoomResponseDto>>> getRooms(
            @RequestParam Long userId) {
        List<ChatRoomResponseDto> rooms = chatService.getRoomsByUserId(userId);
        return ResponseEntity.ok(ResponseDto.success(rooms));
    }

    // [REST] 채팅방 입장 시 이전 메시지 히스토리 일괄 로드
    @GetMapping("/api/chats/rooms/{roomId}/messages")
    public ResponseEntity<ResponseDto<List<ChatMessageResponseDto>>> getMessages(
            @PathVariable Long roomId) {
        List<ChatMessageResponseDto> messages = chatService.getMessages(roomId);
        return ResponseEntity.ok(ResponseDto.success(messages));
    }

    // [STOMP] 실시간 메시지 수신 및 브로드캐스트
    //
    // 전체 데이터 흐름:
    // 1. 클라이언트가 /app/chat.send 로 STOMP SEND 프레임 전송
    // 2. 이 메서드가 수신 → ChatService.saveMessage()로 DB 영속화
    // 3. SimpMessagingTemplate으로 /topic/room/{roomId} 구독자 전원에게 브로드캐스트
    // 4. 양쪽 클라이언트가 구독 콜백에서 메시지를 수신하여 UI 업데이트
    //
    // [JWT 인증 적용 방법 - 추후 구현]
    // 1. ChannelInterceptor 구현체를 configureClientInboundChannel()에 등록
    // 2. CONNECT 프레임 수신 시: StompHeaderAccessor로 "Authorization" 헤더 추출
    // 3. "Bearer {token}" 형식 파싱 → JwtUtil.validateToken()으로 서명/만료 검증
    // 4. 검증 성공: SecurityContextHolder에 UsernamePasswordAuthenticationToken 등록
    // 5. 검증 실패: throw MessageDeliveryException → 클라이언트에 ERROR 프레임 반환
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload @Valid ChatMessageRequestDto requestDto) {
        ChatMessageResponseDto savedMessage = chatService.saveMessage(requestDto);

        // 해당 채팅방을 구독 중인 모든 클라이언트에게 메시지 브로드캐스트
        // 구독 경로: /topic/room/{roomId}
        messagingTemplate.convertAndSend(
                "/topic/room/" + requestDto.getRoomId(),
                savedMessage
        );
    }
}
