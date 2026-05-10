package com.marketapp.backend.domain.item.service;

import com.marketapp.backend.domain.item.dto.CreateItemRequestDto;
import com.marketapp.backend.domain.item.dto.ItemResponseDto;
import com.marketapp.backend.domain.item.entity.Item;
import com.marketapp.backend.domain.item.entity.ItemStatus;
import com.marketapp.backend.domain.item.repository.ItemRepository;
import com.marketapp.backend.domain.trade.dto.CompleteTradeRequestDto;
import com.marketapp.backend.domain.trade.dto.TradeResponseDto;
import com.marketapp.backend.domain.trade.entity.Trade;
import com.marketapp.backend.domain.trade.repository.TradeRepository;
import com.marketapp.backend.domain.user.entity.User;
import com.marketapp.backend.domain.user.repository.UserRepository;
import com.marketapp.backend.global.exception.BusinessException;
import com.marketapp.backend.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ItemService {

    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private final TradeRepository tradeRepository;

    @Transactional
    public ItemResponseDto createItem(Long sellerId, CreateItemRequestDto requestDto) {
        if (requestDto.getQuantity() % 10000 != 0) {
            throw new BusinessException(ErrorCode.INVALID_GOLD_UNIT);
        }

        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        Item item = Item.builder()
                .seller(seller)
                .gameName(requestDto.getGameName())
                .serverName(requestDto.getServerName())
                .category(requestDto.getCategory())
                .quantity(requestDto.getQuantity())
                .pricePerUnit(requestDto.getPricePerUnit())
                .characterName(requestDto.getCharacterName())
                .title(requestDto.getTitle())
                .description(requestDto.getDescription())
                .build();

        return ItemResponseDto.from(itemRepository.save(item));
    }

    public List<ItemResponseDto> getItemList() {
        return itemRepository.findByStatusWithSeller(ItemStatus.FOR_SALE)
                .stream()
                .map(ItemResponseDto::from)
                .collect(Collectors.toList());
    }

    public ItemResponseDto getItemDetail(Long itemId) {
        Item item = itemRepository.findByIdWithSeller(itemId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ITEM_NOT_FOUND));
        return ItemResponseDto.from(item);
    }

    // 거래 완료 처리 - JWT에서 추출한 sellerId를 파라미터로 받아 요청 바디의 sellerId 의존을 제거
    //
    // [보안 + 동시성 이중 방어]
    // 1. sellerId를 JWT(서버 서명)에서 추출하므로, 클라이언트가 타인의 ID를 위조할 수 없다.
    // 2. Item 엔티티의 @Version 필드가 낙관적 잠금을 제공하여,
    //    동시에 두 요청이 같은 매물을 완료하려 할 때 하나만 성공하고 하나는 예외가 발생한다.
    //    GlobalExceptionHandler가 ObjectOptimisticLockingFailureException을 잡아 409로 응답한다.
    @Transactional
    public TradeResponseDto completeTrade(Long itemId, Long sellerId, CompleteTradeRequestDto requestDto) {
        log.info("[거래 완료 시작] itemId={}, sellerId={}, buyerId={}", itemId, sellerId, requestDto.getBuyerId());

        Item item = itemRepository.findByIdWithSeller(itemId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ITEM_NOT_FOUND));

        // JWT 토큰에서 추출한 sellerId와 매물 등록자를 비교
        // 토큰은 서버 서명이므로 위조 불가 → 구매자가 판매자 권한을 사칭하는 공격 방지
        if (!item.getSeller().getId().equals(sellerId)) {
            throw new BusinessException(ErrorCode.ITEM_SELLER_MISMATCH);
        }

        User buyer = userRepository.findById(requestDto.getBuyerId())
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // 1차 방어: 이미 완료된 거래에 대한 단일 요청 차단 (빠른 실패)
        if (item.getStatus() == ItemStatus.COMPLETED) {
            throw new BusinessException(ErrorCode.TRADE_ALREADY_COMPLETED);
        }
        // 2차 방어: @Version 낙관적 잠금이 동시 요청 충돌을 DB 레벨에서 차단
        // → GlobalExceptionHandler가 ObjectOptimisticLockingFailureException을 409로 응답
        item.complete();

        Trade trade = Trade.create(requestDto.getBuyerId(), item.getSeller().getId(), itemId, item.getPrice());
        tradeRepository.save(trade);

        item.getSeller().updateReliabilityScore(0.5);
        buyer.updateReliabilityScore(0.5);
        item.getSeller().incrementTradeCount();
        buyer.incrementTradeCount();

        log.info("[거래 완료] itemId={}, sellerId={}, buyerId={}", itemId, sellerId, requestDto.getBuyerId());
        return TradeResponseDto.from(trade, item.getSeller(), buyer);
    }
}
