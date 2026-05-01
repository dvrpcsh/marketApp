package com.marketapp.backend.domain.community.dto;

import lombok.Builder;
import lombok.Getter;

// 좋아요 토글 응답 - 현재 상태와 갱신된 카운트를 반환하여 프론트가 API 응답만으로 UI를 즉시 업데이트
@Getter
@Builder
public class LikeResponseDto {

    // 토글 후의 현재 좋아요 상태 (true = 좋아요 누름, false = 좋아요 취소)
    private boolean liked;
    private int likeCount;

    public static LikeResponseDto of(boolean liked, int likeCount) {
        return LikeResponseDto.builder()
                .liked(liked)
                .likeCount(likeCount)
                .build();
    }
}
