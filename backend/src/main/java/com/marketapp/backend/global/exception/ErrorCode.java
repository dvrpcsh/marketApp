package com.marketapp.backend.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

// 비즈니스 오류 상황을 코드와 메시지로 중앙 관리
// → 에러 메시지를 코드 곳곳에 하드코딩하지 않고, 여기서만 수정하면 전체 반영되도록 하기 위한 설계 결정
@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // User 도메인
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 사용자입니다."),
    USERNAME_ALREADY_EXISTS(HttpStatus.CONFLICT, "이미 사용 중인 아이디입니다."),
    EMAIL_ALREADY_EXISTS(HttpStatus.CONFLICT, "이미 사용 중인 이메일입니다."),

    // Item 도메인
    ITEM_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 매물입니다."),
    ITEM_SELLER_MISMATCH(HttpStatus.FORBIDDEN, "해당 매물에 대한 권한이 없습니다."),

    // Chat 도메인
    CHAT_ROOM_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 채팅방입니다."),

    // Trade 도메인
    TRADE_ALREADY_COMPLETED(HttpStatus.CONFLICT, "이미 완료된 거래입니다."),

    // 공통
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "요청 값이 올바르지 않습니다."),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 내부 오류가 발생했습니다.");

    private final HttpStatus httpStatus;
    private final String message;
}
