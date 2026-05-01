package com.marketapp.backend.domain.community.dto;

import com.marketapp.backend.domain.community.entity.Comment;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class CommentResponseDto {

    private Long commentId;
    private Long authorId;
    private String authorNickname;
    // 댓글에서도 작성자 신뢰 점수 노출 - 커뮤니티에서도 신뢰받는 유저가 눈에 띄도록
    private double authorReliabilityScore;
    private String content;
    private LocalDateTime createdAt;

    public static CommentResponseDto from(Comment comment) {
        return CommentResponseDto.builder()
                .commentId(comment.getId())
                .authorId(comment.getAuthor().getId())
                .authorNickname(comment.getAuthor().getNickname())
                .authorReliabilityScore(comment.getAuthor().getReliabilityScore())
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}
