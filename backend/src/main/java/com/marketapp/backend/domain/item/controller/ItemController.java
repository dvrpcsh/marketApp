package com.marketapp.backend.domain.item.controller;

import com.marketapp.backend.domain.item.dto.CreateItemRequestDto;
import com.marketapp.backend.domain.item.dto.ItemResponseDto;
import com.marketapp.backend.domain.item.service.ItemService;
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
}
