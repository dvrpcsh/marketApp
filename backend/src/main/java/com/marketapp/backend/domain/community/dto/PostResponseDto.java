package com.marketapp.backend.domain.community.dto;

import com.marketapp.backend.domain.community.entity.Post;
import com.marketapp.backend.domain.community.entity.PostCategory;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

// 게시글 상세 조회용 DTO - 본문 + 댓글 목록 + 현재 유저의 좋아요 여부 포함
@Getter
@Builder
public class PostResponseDto {

    private Long postId;
    private String title;
    private String content;
    private PostCategory category;
    private Long authorId;
    private String authorNickname;
    private double authorReliabilityScore;
    private int likeCount;
    private int commentCount;
    private int viewCount;
    // isLiked: 현재 요청 유저가 이미 좋아요를 눌렀는지 - 프론트엔드 좋아요 버튼 UI 초기 상태 결정
    private boolean isLiked;
    private List<CommentResponseDto> comments;
    private LocalDateTime createdAt;

    public static PostResponseDto from(Post post, boolean isLiked, List<CommentResponseDto> comments) {
        return PostResponseDto.builder()
                .postId(post.getId())
                .title(post.getTitle())
                .content(post.getContent())
                .category(post.getCategory())
                .authorId(post.getAuthor().getId())
                .authorNickname(post.getAuthor().getNickname())
                .authorReliabilityScore(post.getAuthor().getReliabilityScore())
                .likeCount(post.getLikeCount())
                .commentCount(post.getCommentCount())
                .viewCount(post.getViewCount())
                .isLiked(isLiked)
                .comments(comments)
                .createdAt(post.getCreatedAt())
                .build();
    }
}
