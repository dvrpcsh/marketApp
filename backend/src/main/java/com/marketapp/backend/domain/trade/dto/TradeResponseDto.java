package com.marketapp.backend.domain.trade.dto;

import com.marketapp.backend.domain.trade.entity.Trade;
import com.marketapp.backend.domain.user.entity.User;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

// 거래 완료 응답 DTO
// updatedSellerScore / updatedBuyerScore를 포함하여 프론트엔드가 API 응답만으로
// 즉시 갱신된 신뢰 점수를 Alert/토스트로 사용자에게 보여줄 수 있도록 설계
@Getter
@Builder
public class TradeResponseDto {

    private Long tradeId;
    private Long itemId;
    private Long buyerId;
    private Long sellerId;
    private int price;
    private LocalDateTime completedAt;

    // 거래 완료 후 갱신된 신뢰 점수 - 화면 재진입 없이 즉시 반영 가능
    private double updatedSellerScore;
    private double updatedBuyerScore;
    private int updatedSellerTradeCount;
    private int updatedBuyerTradeCount;

    public static TradeResponseDto from(Trade trade, User seller, User buyer) {
        return TradeResponseDto.builder()
                .tradeId(trade.getId())
                .itemId(trade.getItemId())
                .buyerId(trade.getBuyerId())
                .sellerId(trade.getSellerId())
                .price(trade.getPrice())
                .completedAt(trade.getCompletedAt())
                .updatedSellerScore(seller.getReliabilityScore())
                .updatedBuyerScore(buyer.getReliabilityScore())
                .updatedSellerTradeCount(seller.getTradeCount())
                .updatedBuyerTradeCount(buyer.getTradeCount())
                .build();
    }
}
