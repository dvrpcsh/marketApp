package com.marketapp.backend.domain.community.repository;

import com.marketapp.backend.domain.community.entity.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PostLikeRepository extends JpaRepository<PostLike, Long> {

    // 유저가 이미 좋아요를 눌렀는지 확인 - 토글 분기 및 상세 조회 시 isLiked 판단에 사용
    boolean existsByPost_IdAndUserId(Long postId, Long userId);

    // 좋아요 취소 시 레코드 삭제를 위해 엔티티 조회
    Optional<PostLike> findByPost_IdAndUserId(Long postId, Long userId);
}
