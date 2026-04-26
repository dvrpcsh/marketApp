package com.marketapp.backend.global.exception;

import com.marketapp.backend.global.common.ResponseDto;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

// 모든 컨트롤러에서 발생하는 예외를 한 곳에서 처리
// → 각 Controller가 try-catch를 반복하지 않도록 책임 분리
@RestControllerAdvice
public class GlobalExceptionHandler {

    // 비즈니스 규칙 위반 예외 처리 (사용자 없음, 권한 없음 등)
    // ErrorCode에 정의된 HTTP 상태와 메시지를 그대로 응답
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ResponseDto<Void>> handleBusinessException(BusinessException e) {
        ErrorCode errorCode = e.getErrorCode();
        return ResponseEntity
                .status(errorCode.getHttpStatus())
                .body(ResponseDto.failure(errorCode.getMessage()));
    }

    // @Valid 검증 실패 시 어떤 필드가 왜 틀렸는지 상세 메시지로 응답
    // 여러 필드 오류가 동시에 발생한 경우 ", "로 이어붙여 한 번에 전달
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ResponseDto<Void>> handleValidationException(MethodArgumentNotValidException e) {
        String errorMessage = e.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining(", "));
        return ResponseEntity
                .badRequest()
                .body(ResponseDto.failure(errorMessage));
    }

    // 예상치 못한 서버 오류 - 내부 구현 상세를 클라이언트에 노출하지 않도록 일반 메시지로 응답
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ResponseDto<Void>> handleException(Exception e) {
        return ResponseEntity
                .internalServerError()
                .body(ResponseDto.failure(ErrorCode.INTERNAL_SERVER_ERROR.getMessage()));
    }
}
