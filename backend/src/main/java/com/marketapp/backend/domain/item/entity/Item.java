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

    // 낙관적 잠금(Optimistic Locking)을 위한 버전 필드
    //
    // [이 필드가 동시성 문제를 해결하는 이유]
    // 두 요청이 동시에 같은 Item을 COMPLETED로 바꾸려 할 때:
    // - 요청 A, B 모두 version=1인 레코드를 읽음
    // - A가 먼저 커밋: version이 2로 증가
    // - B가 UPDATE 시도: WHERE id=? AND version=1 → 일치하는 행 없음 → JPA가 예외 발생
    // 이중 거래 완료와 신뢰 점수 이중 지급을 DB 레벨에서 차단한다.
    @Version
    private Long version;

    // 판매자 참조 - LAZY 로딩으로 매물 조회 시 불필요한 User 쿼리 방지
    // 명시적으로 필요한 경우에만 JOIN FETCH로 함께 조회
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    // 게임명 - 추후 다중 게임 지원 시 필터링 키로 사용
    @Column(nullable = false, length = 50)
    private String gameName;

    // 게임 서버명 - 같은 게임도 서버별 시세가 다르므로 필수 구분 항목
    @Column(nullable = false, length = 50)
    private String serverName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ItemCategory category;

    // 판매 수량 (골드) - 최소 10,000골드, 10,000 단위
    @Column(nullable = false)
    private long quantity;

    // 최소 구매 수량 (골드) - null이면 제한 없음
    // 판매자가 소량 거래를 방지하고 원하는 최소 단위를 지정할 수 있는 선택 항목
    @Column
    private Long minQuantity;

    // 물품을 전달할 캐릭터명 - 거래 사고 방지를 위한 필수 확인 항목
    @Column(nullable = false, length = 50)
    private String characterName;

    @Column(nullable = false, length = 100)
    private String title;

    // 1만 골드당 판매 단가 (원) - 서버별 시세 비교의 핵심 데이터
    // ex) pricePerUnit=1300 → 1만 골드에 1,300원, 50만 골드면 65,000원
    @Column(nullable = false)
    private int pricePerUnit;

    // KRW 총가격 필드 - 추후 실물화폐 결제 기능 구현 시 사용, 현재는 0으로 유지
    @Builder.Default
    @Column(nullable = false)
    private int price = 0;

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
