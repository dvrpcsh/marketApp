package com.marketapp.backend.domain.auth.controller;

import com.marketapp.backend.domain.auth.dto.EmailSendRequestDto;
import com.marketapp.backend.domain.auth.dto.EmailVerifyRequestDto;
import com.marketapp.backend.domain.auth.service.EmailVerificationService;
import com.marketapp.backend.global.common.ResponseDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth/email")
@RequiredArgsConstructor
public class EmailVerificationController {

    private final EmailVerificationService emailVerificationService;

    // 인증번호 발송 - 회원가입 전 단계이므로 SecurityConfig에서 인증 없이 허용
    @PostMapping("/send")
    public ResponseEntity<ResponseDto<Void>> sendCode(
            @Valid @RequestBody EmailSendRequestDto requestDto) {
        emailVerificationService.sendCode(requestDto.getEmail());
        return ResponseEntity.ok(ResponseDto.success("인증번호가 전송되었습니다.", null));
    }

    // 인증번호 확인
    @PostMapping("/verify")
    public ResponseEntity<ResponseDto<Void>> verifyCode(
            @Valid @RequestBody EmailVerifyRequestDto requestDto) {
        emailVerificationService.verifyCode(requestDto.getEmail(), requestDto.getCode());
        return ResponseEntity.ok(ResponseDto.success("이메일 인증이 완료되었습니다.", null));
    }
}
