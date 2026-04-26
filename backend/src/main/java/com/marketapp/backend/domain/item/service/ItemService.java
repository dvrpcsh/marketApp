package com.marketapp.backend.domain.item.service;

import com.marketapp.backend.domain.item.dto.CreateItemRequestDto;
import com.marketapp.backend.domain.item.dto.ItemResponseDto;
import com.marketapp.backend.domain.item.entity.Item;
import com.marketapp.backend.domain.item.entity.ItemStatus;
import com.marketapp.backend.domain.item.repository.ItemRepository;
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
}
