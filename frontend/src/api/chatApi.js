import apiInstance from './instance';

// 채팅방 생성 또는 기존 방 가져오기
// senderId는 서버가 JWT에서 추출하므로 요청 바디에서 제거
export const findOrCreateChatRoom = async (receiverId, itemId) => {
  return apiInstance.post('/api/chats/rooms', { receiverId, itemId });
};

// 내 채팅방 목록 조회 - userId는 서버가 JWT에서 추출하므로 파라미터 제거
export const fetchMyChatRooms = async () => {
  return apiInstance.get('/api/chats/rooms');
};

// 채팅방 입장 시 이전 대화 내역 로드
export const fetchChatMessages = async (roomId) => {
  return apiInstance.get(`/api/chats/rooms/${roomId}/messages`);
};
