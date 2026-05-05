package com.marketapp.backend.domain.item.controller;

import com.marketapp.backend.domain.chat.service.ChatService;
import com.marketapp.backend.domain.item.dto.CreateItemRequestDto;
import com.marketapp.backend.domain.item.dto.ItemResponseDto;
import com.marketapp.backend.domain.item.service.ItemService;
import com.marketapp.backend.domain.trade.dto.CompleteTradeRequestDto;
import com.marketapp.backend.domain.trade.dto.TradeResponseDto;
import com.marketapp.backend.global.common.ResponseDto;
import com.marketapp.backend.global.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/items")
@RequiredArgsConstructor
public class ItemController {

    private final ItemService itemService;
    private final ChatService chatService;

    // 매물 등록 - JWT에서 sellerId를 추출하므로 @RequestParam sellerId 제거
    // @AuthenticationPrincipal이 null이면 SecurityConfig의 anyRequest().authenticated()에서 차단됨
    @PostMapping
    public ResponseEntity<ResponseDto<ItemResponseDto>> createItem(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateItemRequestDto requestDto) {
        ItemResponseDto response = itemService.createItem(principal.getId(), requestDto);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ResponseDto.success("매물이 등록되었습니다.", response));
    }

    // 판매중인 전체 매물 목록 조회 - 비회원도 접근 가능한 공개 API
    @GetMapping
    public ResponseEntity<ResponseDto<List<ItemResponseDto>>> getItemList() {
        return ResponseEntity.ok(ResponseDto.success(itemService.getItemList()));
    }

    // 매물 상세 조회 - 판매자 신뢰 점수 포함
    @GetMapping("/{itemId}")
    public ResponseEntity<ResponseDto<ItemResponseDto>> getItemDetail(@PathVariable Long itemId) {
        return ResponseEntity.ok(ResponseDto.success(itemService.getItemDetail(itemId)));
    }

    // 거래 완료 처리 - 판매자 권한 검증을 JWT 토큰 기반으로 수행
    // 기존 @RequestParam sellerId 제거: 클라이언트 위조를 방지하고 서버 추출로 신뢰성 확보
    @PostMapping("/{itemId}/complete")
    public ResponseEntity<ResponseDto<TradeResponseDto>> completeTrade(
            @PathVariable Long itemId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CompleteTradeRequestDto requestDto) {

        TradeResponseDto tradeResponse = itemService.completeTrade(itemId, principal.getId(), requestDto);

        if (requestDto.getRoomId() != null) {
            chatService.createAndBroadcastSystemMessage(
                    requestDto.getRoomId(),
                    "🎉 거래가 완료되었습니다! 신뢰 점수가 +0.5점 올랐어요."
            );
        }

        return ResponseEntity.ok(ResponseDto.success("거래가 완료되었습니다.", tradeResponse));
    }
}
