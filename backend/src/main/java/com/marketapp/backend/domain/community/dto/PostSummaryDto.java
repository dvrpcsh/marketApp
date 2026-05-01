package com.marketapp.backend.domain.community.dto;

import com.marketapp.backend.domain.community.entity.Post;
import com.marketapp.backend.domain.community.entity.PostCategory;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

// 게시글 목록 조회용 경량 DTO - 본문 content 제외
// 목록에서 본문까지 함께 반환하면 응답 크기가 커져 스크롤 성능에 영향을 줌
@Getter
@Builder
public class PostSummaryDto {

    private Long postId;
    private String title;
    private PostCategory category;
    private Long authorId;
    private String authorNickname;
    // 목록에서도 작성자 신뢰 점수 노출 - 커뮤니티에서도 신뢰받는 유저 식별 가능
    private double authorReliabilityScore;
    private int likeCount;
    private int commentCount;
    private int viewCount;
    private LocalDateTime createdAt;

    public static PostSummaryDto from(Post post) {
        return PostSummaryDto.builder()
                .postId(post.getId())
                .title(post.getTitle())
                .category(post.getCategory())
                .authorId(post.getAuthor().getId())
                .authorNickname(post.getAuthor().getNickname())
                .authorReliabilityScore(post.getAuthor().getReliabilityScore())
                .likeCount(post.getLikeCount())
                .commentCount(post.getCommentCount())
                .viewCount(post.getViewCount())
                .createdAt(post.getCreatedAt())
                .build();
    }
}
