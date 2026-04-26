package com.marketapp.backend.domain.item.repository;

import com.marketapp.backend.domain.item.entity.Item;
import com.marketapp.backend.domain.item.entity.ItemCategory;
import com.marketapp.backend.domain.item.entity.ItemStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ItemRepository extends JpaRepository<Item, Long> {

    // 목록 조회 시 seller를 JOIN FETCH로 함께 로드
    // → ItemResponseDto 변환 시 seller 필드 접근으로 발생하는 N+1 쿼리 방지
    @Query("SELECT i FROM Item i JOIN FETCH i.seller WHERE i.status = :status ORDER BY i.createdAt DESC")
    List<Item> findByStatusWithSeller(@Param("status") ItemStatus status);

    // 카테고리 + 상태 필터링 - 시세 데이터 조회 시에도 동일 패턴 활용 예정
    @Query("SELECT i FROM Item i JOIN FETCH i.seller WHERE i.category = :category AND i.status = :status ORDER BY i.createdAt DESC")
    List<Item> findByCategoryAndStatusWithSeller(@Param("category") ItemCategory category,
                                                  @Param("status") ItemStatus status);

    // 특정 판매자의 매물 목록 - 프로필 화면 '나의 매물' 섹션에서 사용
    List<Item> findBySellerIdOrderByCreatedAtDesc(Long sellerId);

    // 상세 조회 시 seller를 JOIN FETCH로 함께 로드 - 단건 조회 N+1 방지
    @Query("SELECT i FROM Item i JOIN FETCH i.seller WHERE i.id = :id")
    Optional<Item> findByIdWithSeller(@Param("id") Long id);
}
