package com.marketapp.backend.global.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

// JPA Auditing 활성화
// BaseEntity의 @CreatedDate, @LastModifiedDate 자동 처리를 위해 필수
// → Main 클래스에 두면 테스트 슬라이스(@DataJpaTest) 실행 시 충돌 가능 - 분리 권장
@Configuration
@EnableJpaAuditing
public class JpaAuditingConfig {
}
