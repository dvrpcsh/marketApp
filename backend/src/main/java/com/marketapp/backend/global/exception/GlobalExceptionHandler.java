package com.marketapp.backend.global.exception;

import com.marketapp.backend.global.common.ResponseDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    // 비즈니스 규칙 위반 예외 - ErrorCode에 정의된 HTTP 상태와 메시지를 그대로 응답
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ResponseDto<Void>> handleBusinessException(BusinessException e) {
        ErrorCode errorCode = e.getErrorCode();
        return ResponseEntity
                .status(errorCode.getHttpStatus())
                .body(ResponseDto.failure(errorCode.getMessage()));
    }

    // @Valid 검증 실패 - 어떤 필드가 왜 틀렸는지 상세 메시지로 응답
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ResponseDto<Void>> handleValidationException(MethodArgumentNotValidException e) {
        String errorMessage = e.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining(", "));
        return ResponseEntity
                .badRequest()
                .body(ResponseDto.failure(errorMessage));
    }

    // DB 유니크 제약 위반 (중복 좋아요 등) - BusinessException으로 변환
    //
    // [이 핸들러가 필요한 이유]
    // toggleLike의 PostLike(uk_post_like_user), 기타 DB UNIQUE 제약이
    // 동시 요청 충돌 시 JPA 레이어를 통과하여 DataIntegrityViolationException으로 터진다.
    // 이를 잡아서 사용자에게 이해할 수 있는 메시지로 변환하고, 내부 구현(SQL)은 노출하지 않는다.
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ResponseDto<Void>> handleDataIntegrityViolation(DataIntegrityViolationException e) {
        log.warn("[DB 제약 위반] {}", e.getMostSpecificCause().getMessage());
        return ResponseEntity
                .status(ErrorCode.DATA_INTEGRITY_VIOLATION.getHttpStatus())
                .body(ResponseDto.failure(ErrorCode.DATA_INTEGRITY_VIOLATION.getMessage()));
    }

    // @Version 기반 낙관적 잠금 충돌 - 동시 거래 완료 시도 방어
    //
    // [이 핸들러가 필요한 이유]
    // 두 요청이 동시에 동일한 Item을 COMPLETED로 바꾸려 할 때, JPA의 @Version이
    // 첫 번째 커밋만 허용하고 두 번째에 ObjectOptimisticLockingFailureException을 던진다.
    // 이 예외를 잡아 "이미 완료된 거래" 메시지로 응답하면 이중 거래 완료를 안전하게 차단한다.
    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<ResponseDto<Void>> handleOptimisticLockingFailure(
            ObjectOptimisticLockingFailureException e) {
        log.warn("[낙관적 잠금 충돌] {}", e.getMessage());
        return ResponseEntity
                .status(ErrorCode.CONCURRENT_UPDATE_CONFLICT.getHttpStatus())
                .body(ResponseDto.failure(ErrorCode.CONCURRENT_UPDATE_CONFLICT.getMessage()));
    }

    // 예상치 못한 서버 오류 - 내부 구현을 클라이언트에 노출하지 않음
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ResponseDto<Void>> handleException(Exception e) {
        log.error("[예상치 못한 오류]", e);
        return ResponseEntity
                .internalServerError()
                .body(ResponseDto.failure(ErrorCode.INTERNAL_SERVER_ERROR.getMessage()));
    }
}
