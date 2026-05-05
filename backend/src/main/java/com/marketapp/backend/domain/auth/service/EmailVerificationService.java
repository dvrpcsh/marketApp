package com.marketapp.backend.domain.auth.service;

import com.marketapp.backend.global.exception.BusinessException;
import com.marketapp.backend.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private final JavaMailSender mailSender;

    private record CodeEntry(String code, LocalDateTime expiresAt) {
        boolean isExpired() {
            return LocalDateTime.now().isAfter(expiresAt);
        }
    }

    // 발송된 인증번호 저장 (이메일 → 코드+만료시각)
    private final ConcurrentHashMap<String, CodeEntry> pendingCodes = new ConcurrentHashMap<>();
    // 인증 완료된 이메일 저장 (이메일 → 만료시각) - 회원가입 완료 시 소비됨
    private final ConcurrentHashMap<String, LocalDateTime> verifiedEmails = new ConcurrentHashMap<>();

    // 6자리 인증번호 생성 후 이메일 발송 (유효 시간 5분)
    public void sendCode(String email) {
        String code = String.format("%06d", new Random().nextInt(1_000_000));
        pendingCodes.put(email, new CodeEntry(code, LocalDateTime.now().plusMinutes(5)));

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("[마켓앱] 이메일 인증번호");
        message.setText(
                "안녕하세요, 마켓앱입니다.\n\n" +
                "이메일 인증번호: " + code + "\n\n" +
                "인증번호는 5분간 유효합니다.\n" +
                "본인이 요청하지 않은 경우 이 메일을 무시해주세요."
        );
        mailSender.send(message);
        log.info("[이메일 인증] 코드 발송 완료 - email={}", email);
    }

    // 인증번호 검증 - 성공 시 verifiedEmails에 10분간 유효한 인증 완료 기록
    public void verifyCode(String email, String code) {
        CodeEntry entry = pendingCodes.get(email);

        if (entry == null || entry.isExpired()) {
            throw new BusinessException(ErrorCode.EMAIL_VERIFICATION_EXPIRED);
        }
        if (!entry.code().equals(code)) {
            throw new BusinessException(ErrorCode.EMAIL_VERIFICATION_CODE_INVALID);
        }

        pendingCodes.remove(email);
        verifiedEmails.put(email, LocalDateTime.now().plusMinutes(10));
        log.info("[이메일 인증] 인증 완료 - email={}", email);
    }

    // 이메일 인증 완료 여부 확인 (회원가입 서비스에서 호출)
    public boolean isVerified(String email) {
        LocalDateTime expiresAt = verifiedEmails.get(email);
        return expiresAt != null && LocalDateTime.now().isBefore(expiresAt);
    }

    // 회원가입 완료 후 인증 기록 제거
    public void consumeVerification(String email) {
        verifiedEmails.remove(email);
    }
}
