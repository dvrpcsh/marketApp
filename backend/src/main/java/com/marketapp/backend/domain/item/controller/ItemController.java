package com.marketapp.backend.domain.item.controller;

import com.marketapp.backend.domain.chat.service.ChatService;
import com.marketapp.backend.domain.item.dto.CreateItemRequestDto;
import com.marketapp.backend.domain.item.dto.ItemResponseDto;
import com.marketapp.backend.domain.item.service.ItemService;
import com.marketapp.backend.domain.trade.dto.CompleteTradeRequestDto;
import com.marketapp.backend.domain.trade.dto.TradeResponseDto;
import com.marketapp.backend.global.common.ResponseDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/items")
@RequiredArgsConstructor
public class ItemController {

    private final ItemService itemService;
    private final ChatService chatService;

    // 매물 등록
    // 현재는 sellerId를 쿼리 파라미터로 받음 - JWT 도입 후 @AuthenticationPrincipal로 대체 예정
    @PostMapping
    public ResponseEntity<ResponseDto<ItemResponseDto>> createItem(
            @RequestParam Long sellerId,
            @Valid @RequestBody CreateItemRequestDto requestDto) {
        ItemResponseDto response = itemService.createItem(sellerId, requestDto);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ResponseDto.success("매물이 등록되었습니다.", response));
    }

    // 판매중인 전체 매물 목록 조회 - 비회원도 접근 가능한 공개 API
    @GetMapping
    public ResponseEntity<ResponseDto<List<ItemResponseDto>>> getItemList() {
        List<ItemResponseDto> response = itemService.getItemList();
        return ResponseEntity.ok(ResponseDto.success(response));
    }

    // 매물 상세 조회 - 판매자 신뢰 점수 포함하여 구매 결정에 필요한 정보 제공
    @GetMapping("/{itemId}")
    public ResponseEntity<ResponseDto<ItemResponseDto>> getItemDetail(
            @PathVariable Long itemId) {
        ItemResponseDto response = itemService.getItemDetail(itemId);
        return ResponseEntity.ok(ResponseDto.success(response));
    }

    // 거래 완료 처리 - ChatRoomScreen의 "거래 완료하기" 버튼에서 호출
    // 판매자 권한 검증 + 매물 상태 변경 + 거래 이력 기록 + 신뢰 점수 업데이트를 하나의 트랜잭션으로 처리
    @PostMapping("/{itemId}/complete")
    public ResponseEntity<ResponseDto<TradeResponseDto>> completeTrade(
            @PathVariable Long itemId,
            @Valid @RequestBody CompleteTradeRequestDto requestDto) {

        TradeResponseDto tradeResponse = itemService.completeTrade(itemId, requestDto);

        // 채팅방에 거래 완료 시스템 메시지 전송 - roomId가 있는 경우에만
        // 양쪽 참여자가 채팅방에서 즉시 거래 완료 알림을 받을 수 있도록 처리
        if (requestDto.getRoomId() != null) {
            chatService.createAndBroadcastSystemMessage(
                    requestDto.getRoomId(),
                    "🎉 거래가 완료되었습니다! 신뢰 점수가 +0.5점 올랐어요."
            );
        }

        return ResponseEntity.ok(ResponseDto.success("거래가 완료되었습니다.", tradeResponse));
    }
}
