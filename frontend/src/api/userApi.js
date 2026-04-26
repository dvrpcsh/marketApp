import instance from './instance';

// 회원가입 - SignUpScreen 폼 제출 시 호출
// 요청 필드: { username, password, nickname, email } - 백엔드 SignUpRequestDto와 1:1 대응
export const signUp = (userData) => instance.post('/api/users/signup', userData);

// 사용자 프로필 조회 - MyPageScreen에서 본인 정보 표시 시 호출
export const fetchUserProfile = (userId) => instance.get(`/api/users/${userId}`);
