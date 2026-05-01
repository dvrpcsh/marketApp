package com.marketapp.backend.domain.community.repository;

import com.marketapp.backend.domain.community.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    // 게시글 댓글 목록 - author JOIN FETCH로 N+1 방지 + 오래된 순 정렬 (대화 흐름 유지)
    @Query("SELECT c FROM Comment c JOIN FETCH c.author WHERE c.post.id = :postId ORDER BY c.createdAt ASC")
    List<Comment> findByPostIdWithAuthor(@Param("postId") Long postId);
}
