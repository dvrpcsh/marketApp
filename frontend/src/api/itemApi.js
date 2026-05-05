import instance from './instance';

// 판매중인 전체 매물 목록 조회 - 비회원도 접근 가능한 공개 API
export const fetchItems = () => instance.get('/api/items');

// 매물 상세 조회
export const fetchItemDetail = (itemId) => instance.get(`/api/items/${itemId}`);

// 매물 등록 - sellerId는 서버가 JWT에서 추출하므로 쿼리 파라미터 제거
export const createItem = (itemData) => instance.post('/api/items', itemData);

// 거래 완료 처리
// sellerId는 서버가 JWT에서 추출하므로 요청 바디에서 제거
// 기존: (itemId, sellerId, buyerId, roomId) → 변경: (itemId, buyerId, roomId)
export const completeTrade = (itemId, buyerId, roomId) =>
  instance.post(`/api/items/${itemId}/complete`, { buyerId, roomId });
