package com.marketapp.backend.domain.item.entity;

// 무형 재화 직거래 플랫폼 특성에 맞는 게임 아이템 카테고리
// 추후 시세 차트 데이터와 카테고리를 연결하는 필터 키로도 활용 예정
// 카테고리 확장 시 여기에 항목 추가만으로 대응 가능
public enum ItemCategory {
    CURRENCY,  // 게임재화
    ITEM,      // 아이템
    ETC        // 기타
}
