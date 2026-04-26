package com.marketapp.backend.domain.item.dto;

import com.marketapp.backend.domain.item.entity.ItemCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;

// 매물 등록 요청 데이터
// serverName은 시세 데이터와 연동되는 핵심 필터 키이므로 필수값으로 지정
@Getter
public class CreateItemRequestDto {

    @NotBlank(message = "매물 제목은 필수입니다.")
    @Size(max = 100, message = "제목은 최대 100자입니다.")
    private String title;

    @NotNull(message = "가격은 필수입니다.")
    @Positive(message = "가격은 0보다 커야 합니다.")
    private Integer price;

    @NotNull(message = "카테고리는 필수입니다.")
    private ItemCategory category;

    @NotBlank(message = "서버명은 필수입니다.")
    @Size(max = 50, message = "서버명은 최대 50자입니다.")
    private String serverName;

    @Size(max = 2000, message = "설명은 최대 2000자입니다.")
    private String description;
}
