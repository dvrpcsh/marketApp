package com.marketapp.backend.domain.community.repository;

import com.marketapp.backend.domain.community.entity.Post;
import com.marketapp.backend.domain.community.entity.PostCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostRepository extends JpaRepository<Post, Long> {

    // 전체 목록 조회 - @EntityGraph로 author를 LEFT JOIN으로 함께 로드
    // Sort는 Pageable로 전달 → 서비스에서 "최신순" vs "인기순" 분기
    @EntityGraph(attributePaths = {"author"})
    Page<Post> findAll(Pageable pageable);

    // 카테고리별 필터 조회 - 시세/LFG/자유 탭 선택 시 사용
    @EntityGraph(attributePaths = {"author"})
    Page<Post> findByCategory(PostCategory category, Pageable pageable);
}
