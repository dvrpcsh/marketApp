package com.marketapp.backend.global.exception;

import lombok.Getter;

// 비즈니스 규칙 위반 시 발생시키는 커스텀 예외
// ErrorCode를 품어 Controller까지 전파하고, GlobalExceptionHandler에서 일괄 처리
// → try-catch를 Service 곳곳에 분산시키지 않기 위한 설계 결정
@Getter
public class BusinessException extends RuntimeException {

    private final ErrorCode errorCode;

    public BusinessException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }
}
