package com.marketapp.backend.domain.community.entity;

import com.marketapp.backend.domain.user.entity.User;
import com.marketapp.backend.global.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

// 게시글 댓글 엔티티
// 커뮤니티 활성화의 핵심 - 댓글 수는 게시글의 관심도 지표이자 재방문 유인
@Entity
@Table(name = "post_comments", indexes = {
        @Index(name = "idx_comment_post", columnList = "post_id")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class Comment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 댓글이 속한 게시글 - LAZY 로딩
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    // 댓글 작성자 - LAZY 로딩, 조회 시 JOIN FETCH로 함께 가져옴
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    public static Comment create(Post post, User author, String content) {
        return Comment.builder()
                .post(post)
                .author(author)
                .content(content)
                .build();
    }
}
