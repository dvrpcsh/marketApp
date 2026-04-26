// 가격을 한국 원화 형식으로 포맷 (예: 1500000 → "1,500,000원")
// 매물 목록·상세·등록 화면 등 가격이 표시되는 모든 곳에서 일관된 형식 보장
export const formatPrice = (price) => {
  if (price == null) return '-';
  return `${price.toLocaleString('ko-KR')}원`;
};
