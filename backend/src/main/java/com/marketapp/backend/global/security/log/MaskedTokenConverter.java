package com.marketapp.backend.global.security.log;

import ch.qos.logback.classic.pattern.MessageConverter;
import ch.qos.logback.classic.spi.ILoggingEvent;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

// Logback 메시지에서 JWT 토큰을 자동으로 마스킹하는 커스텀 컨버터
//
// [이 컨버터가 필요한 이유]
// 로그에 JWT 토큰이 그대로 출력되면:
// 1. 로그 파일 접근 권한이 있는 내부자가 토큰을 탈취하여 계정을 사칭할 수 있다.
// 2. 로그 수집 시스템(ELK, CloudWatch 등)에 민감 정보가 무기한 보관된다.
// 이 컨버터는 모든 로그 메시지에서 JWT 형식(eyJ...header.payload.signature)을
// 자동으로 감지하여 앞 10자만 남기고 마스킹함으로써 토큰 유효성을 판단할 수 없게 한다.
public class MaskedTokenConverter extends MessageConverter {

    // JWT는 항상 Base64url 인코딩된 헤더("eyJ"로 시작)로 구성되므로 신뢰할 수 있는 패턴
    // "Bearer " 접두사가 있는 경우와 없는 경우 모두 처리
    private static final Pattern JWT_PATTERN = Pattern.compile(
            "(Bearer\\s+)?(eyJ[A-Za-z0-9_-]{7,})(\\.[A-Za-z0-9_-]+){2}"
    );

    @Override
    public String convert(ILoggingEvent event) {
        String message = super.convert(event);
        if (message == null) return null;

        Matcher matcher = JWT_PATTERN.matcher(message);
        StringBuffer sb = new StringBuffer();

        while (matcher.find()) {
            String prefix = matcher.group(1) != null ? matcher.group(1) : "";
            String tokenStart = matcher.group(2);
            // 앞 10자만 표시하여 어떤 토큰인지 추적은 가능하되 실제 사용은 불가하게 마스킹
            String masked = prefix + tokenStart.substring(0, Math.min(10, tokenStart.length()))
                    + "...[MASKED]";
            matcher.appendReplacement(sb, Matcher.quoteReplacement(masked));
        }
        matcher.appendTail(sb);
        return sb.toString();
    }
}
