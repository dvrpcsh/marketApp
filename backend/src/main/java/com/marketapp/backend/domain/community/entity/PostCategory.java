package com.marketapp.backend.domain.community.entity;

// 라운지 게시판 카테고리
// 커뮤니티 리텐션 전략: 카테고리별 분리로 각 유저 유형(시세 확인자, 파티원 모집, 자유 소통)이
// 자신에게 맞는 콘텐츠를 빠르게 찾도록 유도
public enum PostCategory {
    PRICE_INFO,  // 시세 - 매물 가격 정보 공유, 앱의 핵심 가치인 '실시간 시세' 보완
    LFG,         // LFG(Looking For Group) - 파티원/거래 상대 모집
    FREE         // 자유 - 게임 이야기, 커뮤니티 활성화 목적
}
