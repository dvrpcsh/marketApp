package com.marketapp.backend.domain.item.entity;

// 매물의 생명주기를 표현하는 상태값
// 프론트엔드 필터링 및 거래 흐름 제어에 사용
// COMPLETED 상태 진입 시 판매자의 신뢰 점수 및 거래 횟수 업데이트 트리거
public enum ItemStatus {
    FOR_SALE,   // 판매중 - 구매 의사 표현 가능
    RESERVED,   // 예약중 - 특정 구매자와 거래 진행 중
    COMPLETED   // 거래완료 - 더 이상 거래 불가
}
