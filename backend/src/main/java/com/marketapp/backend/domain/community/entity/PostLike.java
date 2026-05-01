package com.marketapp.backend.domain.community.entity;

import com.marketapp.backend.global.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

// 게시글 좋아요 엔티티
// (post_id, user_id) 유니크 제약으로 유저당 1회 좋아요를 DB 레벨에서 보장
// 애플리케이션 레벨 검증과 이중 방어선을 형성 - 동시 요청 시에도 중복 좋아요 불가
@Entity
@Table(name = "post_likes",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_post_like_user",
                columnNames = {"post_id", "userId"}
        ),
        indexes = @Index(name = "idx_post_like_post", columnList = "post_id")
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class PostLike extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    // 좋아요를 누른 사용자 ID - User 엔티티 대신 ID만 저장하여 사용자 삭제 시에도 좋아요 이력 보존
    @Column(nullable = false)
    private Long userId;

    public static PostLike create(Post post, Long userId) {
        return PostLike.builder()
                .post(post)
                .userId(userId)
                .build();
    }
}
