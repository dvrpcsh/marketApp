package com.marketapp.backend.domain.item.dto;

import com.marketapp.backend.domain.item.entity.Item;
import com.marketapp.backend.domain.item.entity.ItemCategory;
import com.marketapp.backend.domain.item.entity.ItemStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

// 매물 응답 DTO
// 판매자 신뢰 정보(등급, 인증 배지)를 포함하여 구매자가 추가 조회 없이
// 목록 화면에서 바로 판매자 신뢰도를 판단할 수 있도록 설계
@Getter
@Builder
public class ItemResponseDto {

    private Long id;
    private String gameName;
    private String serverName;
    private ItemCategory category;
    private long quantity;

    // 최소 구매 수량 (골드) - null이면 제한 없음
    private Long minQuantity;

    // 1만 골드당 단가 (원) - 서버별 시세 비교의 핵심
    private int pricePerUnit;

    private String characterName;
    private String title;
    private ItemStatus status;
    private String description;
    private LocalDateTime createdAt;

    // ── 판매자 공개 정보 ──────────────────────────────────────────────────────
    // 개인정보 보호를 위해 닉네임·신뢰도·거래 횟수·인증 여부만 노출
    // 인증 배지(ID·폰·계좌)는 구매자가 판매자 신뢰성을 아이콘으로 한눈에 파악하게 하여
    // 거래 결정 시간을 단축하고 신뢰 기반 플랫폼 가치를 강화한다
    private Long sellerId;
    private String sellerNickname;
    private double sellerReliabilityScore;
    private int sellerTradeCount;
    private boolean sellerPhoneVerified;
    private boolean sellerIdentityVerified;
    private boolean sellerBankVerified;

    public static ItemResponseDto from(Item item) {
        return ItemResponseDto.builder()
                .id(item.getId())
                .gameName(item.getGameName())
                .serverName(item.getServerName())
                .category(item.getCategory())
                .quantity(item.getQuantity())
                .minQuantity(item.getMinQuantity())
                .pricePerUnit(item.getPricePerUnit())
                .characterName(item.getCharacterName())
                .title(item.getTitle())
                .status(item.getStatus())
                .description(item.getDescription())
                .createdAt(item.getCreatedAt())
                .sellerId(item.getSeller().getId())
                .sellerNickname(item.getSeller().getNickname())
                .sellerReliabilityScore(item.getSeller().getReliabilityScore())
                .sellerTradeCount(item.getSeller().getTradeCount())
                .sellerPhoneVerified(item.getSeller().isPhoneVerified())
                .sellerIdentityVerified(item.getSeller().isIdentityVerified())
                .sellerBankVerified(item.getSeller().isBankVerified())
                .build();
    }
}
