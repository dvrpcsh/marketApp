package com.marketapp.backend.domain.item.dto;

import com.marketapp.backend.domain.item.entity.Item;
import com.marketapp.backend.domain.item.entity.ItemCategory;
import com.marketapp.backend.domain.item.entity.ItemStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

// 매물 응답 DTO
// 판매자 정보는 최소한의 공개 정보만 포함 - 닉네임과 신뢰 점수만 노출하여 개인정보 보호
@Getter
@Builder
public class ItemResponseDto {

    private Long id;
    private String title;
    private int price;
    private ItemCategory category;
    private String serverName;
    private ItemStatus status;
    private String description;
    private LocalDateTime createdAt;

    // 판매자 최소 공개 정보 - 구매자가 신뢰도를 판단하기 위한 최소한의 정보만 노출
    private Long sellerId;
    private String sellerNickname;
    private double sellerReliabilityScore;

    public static ItemResponseDto from(Item item) {
        return ItemResponseDto.builder()
                .id(item.getId())
                .title(item.getTitle())
                .price(item.getPrice())
                .category(item.getCategory())
                .serverName(item.getServerName())
                .status(item.getStatus())
                .description(item.getDescription())
                .createdAt(item.getCreatedAt())
                .sellerId(item.getSeller().getId())
                .sellerNickname(item.getSeller().getNickname())
                .sellerReliabilityScore(item.getSeller().getReliabilityScore())
                .build();
    }
}
