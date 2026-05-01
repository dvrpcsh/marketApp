package com.marketapp.backend.domain.community.entity;

import com.marketapp.backend.domain.user.entity.User;
import com.marketapp.backend.global.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

// 라운지 게시글 엔티티
// likeCount / commentCount / viewCount를 비정규화(Denormalization)하여 목록 조회 시
// COUNT 쿼리를 생략 - 게시글 수가 많아질수록 목록 API 성능에 직접적으로 영향을 줌
@Entity
@Table(name = "posts", indexes = {
        @Index(name = "idx_post_category", columnList = "category"),
        @Index(name = "idx_post_like_count", columnList = "likeCount DESC")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class Post extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 작성자 참조 - LAZY 로딩, 목록 조회 시 EntityGraph로 함께 로드
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    // 게시글 삭제 시 연관된 댓글/좋아요를 함께 삭제 - orphanRemoval로 고아 레코드 방지
    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<Comment> comments = new java.util.ArrayList<>();

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<PostLike> likes = new java.util.ArrayList<>();

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PostCategory category;

    // 좋아요 수 - PostLike 테이블 COUNT 쿼리 대신 비정규화된 값 사용 (목록 조회 성능)
    @Column(nullable = false)
    @Builder.Default
    private int likeCount = 0;

    // 댓글 수 - Comment 테이블 COUNT 쿼리 대신 비정규화 (인기 게시글 판단 지표로도 활용)
    @Column(nullable = false)
    @Builder.Default
    private int commentCount = 0;

    // 조회수 - 실제 콘텐츠 소비량 측정 지표, 추후 게시글 노출 알고리즘에 활용 예정
    @Column(nullable = false)
    @Builder.Default
    private int viewCount = 0;

    // 게시글 제목/내용 수정 - 작성자 권한 검증은 Service에서 처리
    public void update(String title, String content) {
        this.title = title;
        this.content = content;
    }

    public void incrementViewCount() {
        this.viewCount++;
    }

    public void incrementLikeCount() {
        this.likeCount++;
    }

    public void decrementLikeCount() {
        this.likeCount = Math.max(0, this.likeCount - 1);
    }

    public void incrementCommentCount() {
        this.commentCount++;
    }

    public void decrementCommentCount() {
        this.commentCount = Math.max(0, this.commentCount - 1);
    }
}
