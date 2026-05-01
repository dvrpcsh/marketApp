import apiInstance from './instance';

// 채팅방 생성 또는 기존 방 가져오기
// 동일한 senderId + receiverId + itemId 조합이면 서버에서 기존 방 반환
export const findOrCreateChatRoom = async (senderId, receiverId, itemId) => {
  return apiInstance.post('/api/chats/rooms', { senderId, receiverId, itemId });
};

// 특정 사용자가 참여 중인 채팅방 목록 조회
export const fetchMyChatRooms = async (userId) => {
  return apiInstance.get('/api/chats/rooms', { params: { userId } });
};

// 채팅방 입장 시 이전 대화 내역 로드
export const fetchChatMessages = async (roomId) => {
  return apiInstance.get(`/api/chats/rooms/${roomId}/messages`);
};
