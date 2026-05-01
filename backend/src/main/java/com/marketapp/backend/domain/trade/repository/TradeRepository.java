package com.marketapp.backend.domain.trade.repository;

import com.marketapp.backend.domain.trade.entity.Trade;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TradeRepository extends JpaRepository<Trade, Long> {

    // 매물에 대한 거래 이력 존재 여부 - ItemStatus 검증에 더불어 이중 안전장치
    boolean existsByItemId(Long itemId);
}
