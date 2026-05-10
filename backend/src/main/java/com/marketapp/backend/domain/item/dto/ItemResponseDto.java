package com.marketapp.backend.domain.item.dto;

import com.marketapp.backend.domain.item.entity.Item;
import com.marketapp.backend.domain.item.entity.ItemCategory;
import com.marketapp.backend.domain.item.entity.ItemStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ItemResponseDto {

    private Long id;
    private String gameName;
    private String serverName;
    private ItemCategory category;
    private long quantity;
    private String characterName;
    private String title;
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
                .gameName(item.getGameName())
                .serverName(item.getServerName())
                .category(item.getCategory())
                .quantity(item.getQuantity())
                .characterName(item.getCharacterName())
                .title(item.getTitle())
                .status(item.getStatus())
                .description(item.getDescription())
                .createdAt(item.getCreatedAt())
                .sellerId(item.getSeller().getId())
                .sellerNickname(item.getSeller().getNickname())
                .sellerReliabilityScore(item.getSeller().getReliabilityScore())
                .build();
    }
}
