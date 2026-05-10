package com.marketapp.backend.domain.item.dto;

import com.marketapp.backend.domain.item.entity.ItemCategory;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class CreateItemRequestDto {

    @NotBlank(message = "게임명은 필수입니다.")
    @Size(max = 50, message = "게임명은 최대 50자입니다.")
    private String gameName;

    @NotBlank(message = "서버는 필수입니다.")
    @Size(max = 50, message = "서버명은 최대 50자입니다.")
    private String serverName;

    @NotNull(message = "물품 종류는 필수입니다.")
    private ItemCategory category;

    @NotNull(message = "판매 수량은 필수입니다.")
    @Min(value = 10000, message = "최소 10,000골드 이상이어야 합니다.")
    private Long quantity;

    // 1만 골드당 판매 단가 (원) - 구매자가 서버 간 시세를 비교하는 핵심 데이터
    @NotNull(message = "1만 골드당 가격은 필수입니다.")
    @Min(value = 1, message = "가격은 1원 이상이어야 합니다.")
    private Integer pricePerUnit;

    @NotBlank(message = "캐릭터명은 필수입니다.")
    @Size(max = 50, message = "캐릭터명은 최대 50자입니다.")
    private String characterName;

    @NotBlank(message = "매물 제목은 필수입니다.")
    @Size(max = 100, message = "제목은 최대 100자입니다.")
    private String title;

    @Size(max = 2000, message = "설명은 최대 2000자입니다.")
    private String description;
}
