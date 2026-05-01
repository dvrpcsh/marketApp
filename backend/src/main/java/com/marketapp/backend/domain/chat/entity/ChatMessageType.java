package com.marketapp.backend.domain.chat.entity;

// 채팅 메시지의 종류를 구분하는 타입
// SYSTEM 타입은 거래 완료 등 서비스 이벤트를 채팅방 참여자에게 알리기 위한 시스템 메시지
// 프론트엔드는 이 타입을 보고 말풍선(NORMAL)과 중앙 배너(SYSTEM)를 다르게 렌더링
public enum ChatMessageType {
    NORMAL,  // 사용자 간 일반 텍스트 메시지
    SYSTEM   // 거래 완료 알림 등 서버/시스템 발생 이벤트 메시지 (senderId = 0)
}
