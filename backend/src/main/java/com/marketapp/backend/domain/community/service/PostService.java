package com.marketapp.backend.domain.community.service;

import com.marketapp.backend.domain.community.dto.*;
import com.marketapp.backend.domain.community.entity.*;
import com.marketapp.backend.domain.community.repository.*;
import com.marketapp.backend.domain.user.entity.User;
import com.marketapp.backend.domain.user.repository.UserRepository;
import com.marketapp.backend.global.exception.BusinessException;
import com.marketapp.backend.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PostService {

    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final PostLikeRepository postLikeRepository;
    private final UserRepository userRepository;

    // 게시글 목록 조회
    // sort = "popular": likeCount 내림차순 (인기 탭) / 그 외: createdAt 내림차순 (최신 탭)
    // category = null: 전체 조회 / 지정 시 해당 카테고리만 필터
    public Page<PostSummaryDto> getPosts(PostCategory category, String sort, int page, int size) {
        Sort sortSpec = "popular".equals(sort)
                ? Sort.by("likeCount").descending().and(Sort.by("createdAt").descending())
                : Sort.by("createdAt").descending();

        Pageable pageable = PageRequest.of(page, size, sortSpec);

        Page<Post> posts = (category != null)
                ? postRepository.findByCategory(category, pageable)
                : postRepository.findAll(pageable);

        return posts.map(PostSummaryDto::from);
    }

    // 게시글 상세 조회 - 조회수 증가 + 댓글 로드 + 현재 유저 좋아요 여부 확인
    @Transactional
    public PostResponseDto getPost(Long postId, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));

        // 조회할 때마다 viewCount 증가 - JPA 변경 감지가 트랜잭션 종료 시 자동 UPDATE
        post.incrementViewCount();

        List<CommentResponseDto> comments = commentRepository.findByPostIdWithAuthor(postId)
                .stream()
                .map(CommentResponseDto::from)
                .collect(Collectors.toList());

        boolean isLiked = (userId != null) && postLikeRepository.existsByPost_IdAndUserId(postId, userId);

        return PostResponseDto.from(post, isLiked, comments);
    }

    // 게시글 작성
    // authorId: JWT 도입 후 @AuthenticationPrincipal에서 자동 추출 예정
    @Transactional
    public PostResponseDto createPost(Long authorId, CreatePostRequestDto requestDto) {
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        Post post = Post.builder()
                .author(author)
                .title(requestDto.getTitle())
                .content(requestDto.getContent())
                .category(requestDto.getCategory())
                .build();

        return PostResponseDto.from(postRepository.save(post), false, List.of());
    }

    // 게시글 수정 - 작성자 본인만 수정 가능
    @Transactional
    public PostResponseDto updatePost(Long postId, Long authorId, UpdatePostRequestDto requestDto) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));

        if (!post.getAuthor().getId().equals(authorId)) {
            throw new BusinessException(ErrorCode.POST_AUTHOR_MISMATCH);
        }

        post.update(requestDto.getTitle(), requestDto.getContent());

        List<CommentResponseDto> comments = commentRepository.findByPostIdWithAuthor(postId)
                .stream()
                .map(CommentResponseDto::from)
                .collect(Collectors.toList());

        return PostResponseDto.from(post, postLikeRepository.existsByPost_IdAndUserId(postId, authorId), comments);
    }

    // 게시글 삭제 - 작성자 본인만 삭제 가능, 연관 댓글/좋아요는 CASCADE로 함께 삭제
    @Transactional
    public void deletePost(Long postId, Long authorId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));

        if (!post.getAuthor().getId().equals(authorId)) {
            throw new BusinessException(ErrorCode.POST_AUTHOR_MISMATCH);
        }

        postRepository.delete(post);
    }

    // 댓글 작성 - 작성 후 게시글의 commentCount 증가 (비정규화 값 동기화)
    @Transactional
    public CommentResponseDto createComment(Long postId, Long authorId, CreateCommentRequestDto requestDto) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));

        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        Comment comment = Comment.create(post, author, requestDto.getContent());
        post.incrementCommentCount();

        return CommentResponseDto.from(commentRepository.save(comment));
    }

    // 댓글 삭제 - 작성자 본인만 삭제 가능, 삭제 후 게시글 commentCount 감소
    @Transactional
    public void deleteComment(Long postId, Long commentId, Long authorId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COMMENT_NOT_FOUND));

        if (!comment.getAuthor().getId().equals(authorId)) {
            throw new BusinessException(ErrorCode.COMMENT_AUTHOR_MISMATCH);
        }

        commentRepository.delete(comment);
        post.decrementCommentCount();
    }

    // 좋아요 토글 - 이미 좋아요 상태면 취소, 아니면 추가
    // DB 유니크 제약(uk_post_like_user)이 동시 요청 시에도 중복 방지 최종 수호자
    @Transactional
    public LikeResponseDto toggleLike(Long postId, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));

        boolean alreadyLiked = postLikeRepository.existsByPost_IdAndUserId(postId, userId);

        if (alreadyLiked) {
            PostLike like = postLikeRepository.findByPost_IdAndUserId(postId, userId)
                    .orElseThrow();
            postLikeRepository.delete(like);
            post.decrementLikeCount();
            return LikeResponseDto.of(false, post.getLikeCount());
        } else {
            postLikeRepository.save(PostLike.create(post, userId));
            post.incrementLikeCount();
            return LikeResponseDto.of(true, post.getLikeCount());
        }
    }
}
