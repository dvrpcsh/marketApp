package com.marketapp.backend.domain.community.controller;

import com.marketapp.backend.domain.community.dto.*;
import com.marketapp.backend.domain.community.entity.PostCategory;
import com.marketapp.backend.domain.community.service.PostService;
import com.marketapp.backend.global.common.ResponseDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    // 게시글 목록 조회
    // category: PRICE_INFO | LFG | FREE | (생략 = 전체)
    // sort: latest(기본) | popular(좋아요 순)
    @GetMapping
    public ResponseEntity<ResponseDto<Page<PostSummaryDto>>> getPosts(
            @RequestParam(required = false) PostCategory category,
            @RequestParam(defaultValue = "latest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ResponseDto.success(postService.getPosts(category, sort, page, size)));
    }

    // 게시글 작성
    // JWT 도입 후 @AuthenticationPrincipal로 authorId 자동 추출 예정
    @PostMapping
    public ResponseEntity<ResponseDto<PostResponseDto>> createPost(
            @RequestParam Long authorId,
            @Valid @RequestBody CreatePostRequestDto requestDto) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ResponseDto.success("게시글이 등록되었습니다.", postService.createPost(authorId, requestDto)));
    }

    // 게시글 상세 조회 - 조회수 증가 + 댓글 목록 + 현재 유저 좋아요 여부
    @GetMapping("/{postId}")
    public ResponseEntity<ResponseDto<PostResponseDto>> getPost(
            @PathVariable Long postId,
            @RequestParam(required = false) Long userId) {
        return ResponseEntity.ok(ResponseDto.success(postService.getPost(postId, userId)));
    }

    // 게시글 수정 - 작성자 본인만 가능
    @PutMapping("/{postId}")
    public ResponseEntity<ResponseDto<PostResponseDto>> updatePost(
            @PathVariable Long postId,
            @RequestParam Long authorId,
            @Valid @RequestBody UpdatePostRequestDto requestDto) {
        return ResponseEntity.ok(ResponseDto.success(postService.updatePost(postId, authorId, requestDto)));
    }

    // 게시글 삭제 - 작성자 본인만 가능
    @DeleteMapping("/{postId}")
    public ResponseEntity<ResponseDto<Void>> deletePost(
            @PathVariable Long postId,
            @RequestParam Long authorId) {
        postService.deletePost(postId, authorId);
        return ResponseEntity.ok(ResponseDto.success(null));
    }

    // 댓글 작성
    @PostMapping("/{postId}/comments")
    public ResponseEntity<ResponseDto<CommentResponseDto>> createComment(
            @PathVariable Long postId,
            @RequestParam Long authorId,
            @Valid @RequestBody CreateCommentRequestDto requestDto) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ResponseDto.success("댓글이 등록되었습니다.", postService.createComment(postId, authorId, requestDto)));
    }

    // 댓글 삭제 - 작성자 본인만 가능
    @DeleteMapping("/{postId}/comments/{commentId}")
    public ResponseEntity<ResponseDto<Void>> deleteComment(
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @RequestParam Long authorId) {
        postService.deleteComment(postId, commentId, authorId);
        return ResponseEntity.ok(ResponseDto.success(null));
    }

    // 좋아요 토글 - 이미 좋아요면 취소, 아니면 추가 (유저당 1회 제한)
    @PostMapping("/{postId}/like")
    public ResponseEntity<ResponseDto<LikeResponseDto>> toggleLike(
            @PathVariable Long postId,
            @RequestParam Long userId) {
        return ResponseEntity.ok(ResponseDto.success(postService.toggleLike(postId, userId)));
    }
}
