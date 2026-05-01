package com.marketapp.backend.domain.trade.entity;

import com.marketapp.backend.global.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

// 거래 완료 이력 엔티티 - 거래가 성사된 순간의 스냅샷
//
// 신뢰 시스템의 핵심 근거 데이터:
// - 신뢰 점수(reliabilityScore)는 이 테이블에 기록된 거래를 기반으로 상승
// - 분쟁 발생 시 거래 이력 조회를 통해 양측 주장의 사실 여부 확인 가능
// - 향후 사기/허위 거래 감지 로직의 원본 데이터로도 활용 예정
@Entity
@Table(name = "trades", indexes = {
        @Index(name = "idx_trade_item", columnList = "itemId"),
        @Index(name = "idx_trade_buyer", columnList = "buyerId"),
        @Index(name = "idx_trade_seller", columnList = "sellerId")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class Trade extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 구매자 ID - 직접 참조 대신 ID만 저장하여 사용자 삭제 시에도 거래 이력 보존
    @Column(nullable = false)
    private Long buyerId;

    // 판매자 ID
    @Column(nullable = false)
    private Long sellerId;

    // 어떤 매물에 대한 거래인지 - Item 삭제 후에도 이력 보존을 위해 ID로만 참조
    @Column(nullable = false)
    private Long itemId;

    // 거래 당시의 가격 - Item.price가 나중에 변경될 수 있으므로 거래 시점 가격을 별도 기록
    @Column(nullable = false)
    private int price;

    // 거래 완료 시각 - BaseEntity.createdAt과 동일 시점이지만, 의미를 명확히 하기 위해 별도 필드로 관리
    @Column(nullable = false)
    private LocalDateTime completedAt;

    public static Trade create(Long buyerId, Long sellerId, Long itemId, int price) {
        return Trade.builder()
                .buyerId(buyerId)
                .sellerId(sellerId)
                .itemId(itemId)
                .price(price)
                .completedAt(LocalDateTime.now())
                .build();
    }
}
