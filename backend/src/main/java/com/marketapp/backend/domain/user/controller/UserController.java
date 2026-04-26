package com.marketapp.backend.domain.user.controller;

import com.marketapp.backend.domain.user.dto.SignUpRequestDto;
import com.marketapp.backend.domain.user.dto.UserProfileResponseDto;
import com.marketapp.backend.domain.user.service.UserService;
import com.marketapp.backend.global.common.ResponseDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // 일반 회원가입
    // 중복 검증 및 비밀번호 암호화는 Service에서 처리 - 여기서는 요청 수신과 응답 반환만 담당
    @PostMapping("/signup")
    public ResponseEntity<ResponseDto<UserProfileResponseDto>> signUp(
            @Valid @RequestBody SignUpRequestDto requestDto) {
        UserProfileResponseDto response = userService.signUp(requestDto);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ResponseDto.success("회원가입이 완료되었습니다.", response));
    }

    // 사용자 프로필 조회
    // 추후 JWT 필터 적용 후 본인 또는 공개 프로필만 조회 가능하도록 제한 예정
    @GetMapping("/{userId}")
    public ResponseEntity<ResponseDto<UserProfileResponseDto>> getUserProfile(
            @PathVariable Long userId) {
        UserProfileResponseDto response = userService.getUserProfile(userId);
        return ResponseEntity.ok(ResponseDto.success(response));
    }
}
