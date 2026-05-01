package com.marketapp.backend.domain.item.entity;

import com.marketapp.backend.domain.user.entity.User;
import com.marketapp.backend.global.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

// 마켓앱의 거래 핵심 단위 - 판매자가 등록하는 무형 재화 매물
// 가격 변동 이력은 현재 단일 price 필드로 관리하며, 추후 PriceHistory 테이블 분리 확장 예정
@Entity
@Table(name = "items")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class Item extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 판매자 참조 - LAZY 로딩으로 매물 조회 시 불필요한 User 쿼리 방지
    // 명시적으로 필요한 경우에만 JOIN FETCH로 함께 조회
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @Column(nullable = false, length = 100)
    private String title;

    // 가격 단위: 원(KRW) 기준, 추후 시세 차트와의 가격 비교 포인트
    @Column(nullable = false)
    private int price;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ItemCategory category;

    // 게임 서버명 - 같은 게임도 서버별 시세가 다르므로 필수 구분 항목
    // 시세 데이터 조회 시에도 서버명으로 필터링하는 핵심 키값
    @Column(nullable = false, length = 50)
    private String serverName;

    // 매물 상태 - 신규 등록 시 항상 판매중(FOR_SALE)으로 시작
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ItemStatus status = ItemStatus.FOR_SALE;

    @Column(columnDefinition = "TEXT")
    private String description;

    // 매물 예약 처리 - 구매자와 채팅이 시작될 때 호출
    // 판매중 상태에서만 예약 가능하도록 상태 전이 규칙 강제
    public void reserve() {
        if (this.status != ItemStatus.FOR_SALE) {
            throw new IllegalStateException("판매중인 매물만 예약할 수 있습니다.");
        }
        this.status = ItemStatus.RESERVED;
    }

    // 거래 완료 처리 - 완료 후 판매자/구매자 신뢰 점수 및 거래 횟수 업데이트는 Service에서 처리
    // COMPLETED → COMPLETED 재시도만 차단: 판매중(FOR_SALE)이나 예약중(RESERVED) 모두 완료 가능
    // → 판매자가 예약 과정 없이 채팅방에서 바로 거래를 완료하는 실제 사용 패턴 수용
    public void complete() {
        if (this.status == ItemStatus.COMPLETED) {
            throw new IllegalStateException("이미 완료된 거래입니다.");
        }
        this.status = ItemStatus.COMPLETED;
    }

    // 가격 수정 - 판매중 상태에서만 허용, 추후 가격 이력 기록 로직 추가 예정
    public void updatePrice(int newPrice) {
        if (this.status != ItemStatus.FOR_SALE) {
            throw new IllegalStateException("판매중인 매물만 가격을 수정할 수 있습니다.");
        }
        this.price = newPrice;
    }
}
