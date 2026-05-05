package com.marketapp.backend.domain.community.controller;

import com.marketapp.backend.domain.community.dto.*;
import com.marketapp.backend.domain.community.entity.PostCategory;
import com.marketapp.backend.domain.community.service.PostService;
import com.marketapp.backend.global.common.ResponseDto;
import com.marketapp.backend.global.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    // 게시글 목록 조회 - 비회원도 허용 (SecurityConfig GET /api/posts permitAll)
    @GetMapping
    public ResponseEntity<ResponseDto<Page<PostSummaryDto>>> getPosts(
            @RequestParam(required = false) PostCategory category,
            @RequestParam(defaultValue = "latest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ResponseDto.success(postService.getPosts(category, sort, page, size)));
    }

    // 게시글 작성 - JWT 필터가 인증을 보장하므로 principal은 항상 non-null
    // 기존 @RequestParam Long authorId 제거: 클라이언트 위조 가능성 제거
    @PostMapping
    public ResponseEntity<ResponseDto<PostResponseDto>> createPost(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreatePostRequestDto requestDto) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ResponseDto.success("게시글이 등록되었습니다.",
                        postService.createPost(principal.getId(), requestDto)));
    }

    // 게시글 상세 조회 - 비회원도 허용 / 로그인한 경우 본인의 좋아요 여부 포함
    // principal은 비인증 요청 시 null이므로 required = false로 설정
    @GetMapping("/{postId}")
    public ResponseEntity<ResponseDto<PostResponseDto>> getPost(
            @PathVariable Long postId,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long userId = (principal != null) ? principal.getId() : null;
        return ResponseEntity.ok(ResponseDto.success(postService.getPost(postId, userId)));
    }

    // 게시글 수정 - 작성자 본인만 가능 (Service에서 authorId 일치 검증)
    @PutMapping("/{postId}")
    public ResponseEntity<ResponseDto<PostResponseDto>> updatePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdatePostRequestDto requestDto) {
        return ResponseEntity.ok(ResponseDto.success(
                postService.updatePost(postId, principal.getId(), requestDto)));
    }

    // 게시글 삭제 - 작성자 본인만 가능
    @DeleteMapping("/{postId}")
    public ResponseEntity<ResponseDto<Void>> deletePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal UserPrincipal principal) {
        postService.deletePost(postId, principal.getId());
        return ResponseEntity.ok(ResponseDto.success(null));
    }

    // 댓글 작성
    @PostMapping("/{postId}/comments")
    public ResponseEntity<ResponseDto<CommentResponseDto>> createComment(
            @PathVariable Long postId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateCommentRequestDto requestDto) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ResponseDto.success("댓글이 등록되었습니다.",
                        postService.createComment(postId, principal.getId(), requestDto)));
    }

    // 댓글 삭제 - 작성자 본인만 가능
    @DeleteMapping("/{postId}/comments/{commentId}")
    public ResponseEntity<ResponseDto<Void>> deleteComment(
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserPrincipal principal) {
        postService.deleteComment(postId, commentId, principal.getId());
        return ResponseEntity.ok(ResponseDto.success(null));
    }

    // 좋아요 토글 - 이미 좋아요면 취소, 아니면 추가 (유저당 1회 제한)
    @PostMapping("/{postId}/like")
    public ResponseEntity<ResponseDto<LikeResponseDto>> toggleLike(
            @PathVariable Long postId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ResponseDto.success(postService.toggleLike(postId, principal.getId())));
    }
}
