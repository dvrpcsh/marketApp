import instance from './instance';

// 판매중인 전체 매물 목록 조회
// HomeScreen 진입 시 호출 - 비회원도 접근 가능한 공개 API
export const fetchItems = () => instance.get('/api/items');

// 매물 상세 조회 - ItemDetailScreen에서 itemId로 상세 정보 + 판매자 신뢰 점수를 한 번에 가져옴
export const fetchItemDetail = (itemId) => instance.get(`/api/items/${itemId}`);

// 매물 등록 - JWT 도입 전까지 sellerId를 쿼리 파라미터로 전달 (추후 토큰에서 자동 추출로 변경 예정)
export const createItem = (sellerId, itemData) =>
  instance.post(`/api/items?sellerId=${sellerId}`, itemData);
