package com.marketapp.backend.global.common;

import lombok.Getter;

// 프론트엔드와의 일관된 응답 계약을 위한 공통 래퍼 클래스
// success 필드로 처리 성공/실패를, data 필드로 실제 페이로드를 전달
// → 프론트가 분기 처리 로직을 일원화할 수 있도록 하기 위한 설계 결정
@Getter
public class ResponseDto<T> {

    private final boolean success;
    private final String message;
    private final T data;

    private ResponseDto(boolean success, String message, T data) {
        this.success = success;
        this.message = message;
        this.data = data;
    }

    public static <T> ResponseDto<T> success(String message, T data) {
        return new ResponseDto<>(true, message, data);
    }

    public static <T> ResponseDto<T> success(T data) {
        return new ResponseDto<>(true, "요청이 성공적으로 처리되었습니다.", data);
    }

    public static <T> ResponseDto<T> failure(String message) {
        return new ResponseDto<>(false, message, null);
    }
}
