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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ItemService {

    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private final TradeRepository tradeRepository;

    // 매물 등록 - 판매자 존재 여부 확인 후 등록
    // 현재는 sellerId를 파라미터로 받지만, JWT 도입 후에는 토큰에서 추출하여 파라미터 제거 예정
    @Transactional
    public ItemResponseDto createItem(Long sellerId, CreateItemRequestDto requestDto) {
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        Item item = Item.builder()
                .seller(seller)
                .title(requestDto.getTitle())
                .price(requestDto.getPrice())
                .category(requestDto.getCategory())
                .serverName(requestDto.getServerName())
                .description(requestDto.getDescription())
                .build();

        return ItemResponseDto.from(itemRepository.save(item));
    }

    // 판매중인 전체 매물 목록 조회
    // 완료/예약중 매물은 제외 - 구매자가 실제로 살 수 있는 매물만 메인 목록에 노출
    // seller를 JOIN FETCH로 함께 조회하여 N+1 문제 방지
    public List<ItemResponseDto> getItemList() {
        return itemRepository.findByStatusWithSeller(ItemStatus.FOR_SALE)
                .stream()
                .map(ItemResponseDto::from)
                .collect(Collectors.toList());
    }

    // 매물 상세 조회 - 구매 결정에 필요한 seller 신뢰 점수 포함하여 반환
    // JOIN FETCH로 seller를 한 번의 쿼리에 함께 조회
    public ItemResponseDto getItemDetail(Long itemId) {
        Item item = itemRepository.findByIdWithSeller(itemId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ITEM_NOT_FOUND));
        return ItemResponseDto.from(item);
    }

    // 거래 완료 처리 - 채팅방의 "거래 완료하기" 버튼에서 호출
    //
    // 신뢰 점수 보장 설계:
    // 1. 판매자 본인 확인: 구매자가 허위로 거래를 완료 처리하는 악용 방지
    //    JWT 도입 후: requestDto.sellerId 대신 @AuthenticationPrincipal로 서버에서 직접 추출
    // 2. 중복 완료 방지: COMPLETED 상태 진입 시 예외 발생 → 신뢰 점수 이중 지급 차단
    // 3. 거래 이력 저장: 취소 불가 기록 → 분쟁 시 사실 확인 근거
    // 4. 양측 점수 동반 상승: 구매자도 신뢰 있는 거래 참여자로 인정
    @Transactional
    public TradeResponseDto completeTrade(Long itemId, CompleteTradeRequestDto requestDto) {
        Item item = itemRepository.findByIdWithSeller(itemId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ITEM_NOT_FOUND));

        // [보안] 판매자 본인 검증
        // 오직 매물의 판매자만 거래를 완료할 수 있음
        // JWT 도입 후: requestDto.getSellerId() 대신 토큰의 subject(userId)와 비교
        if (!item.getSeller().getId().equals(requestDto.getSellerId())) {
            throw new BusinessException(ErrorCode.ITEM_SELLER_MISMATCH);
        }

        // 이미 완료된 거래 중복 처리 방지 - 신뢰 점수 이중 지급 차단
        if (item.getStatus() == ItemStatus.COMPLETED) {
            throw new BusinessException(ErrorCode.TRADE_ALREADY_COMPLETED);
        }

        User buyer = userRepository.findById(requestDto.getBuyerId())
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // 1) 매물 상태 COMPLETED로 전환 - 더 이상 다른 구매자에게 노출되지 않음
        item.complete();

        // 2) 거래 이력 저장 - 취소 불가 기록으로 신뢰 시스템의 근거 데이터
        Trade trade = Trade.create(requestDto.getBuyerId(), item.getSeller().getId(), itemId, item.getPrice());
        tradeRepository.save(trade);

        // 3) 신뢰 점수 업데이트 (+0.5점)
        // 판매자: 성공적 거래 완료로 신뢰 상승
        // 구매자: 안정적인 거래 참여자로 인정 → 상대방이 믿고 거래할 수 있는 근거
        item.getSeller().updateReliabilityScore(0.5);
        buyer.updateReliabilityScore(0.5);

        // 4) 거래 횟수 증가 - 프로필에서 "거래 N회 완료"로 표시되는 신뢰 지표
        item.getSeller().incrementTradeCount();
        buyer.incrementTradeCount();

        return TradeResponseDto.from(trade, item.getSeller(), buyer);
    }
}
