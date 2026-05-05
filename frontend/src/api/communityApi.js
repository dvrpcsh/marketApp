import instance from './instance';

// 게시글 목록 조회 - 비회원도 접근 가능
export const fetchPosts = (category, sort = 'latest', page = 0, size = 20) => {
  const params = { sort, page, size };
  if (category) params.category = category;
  return instance.get('/api/posts', { params });
};

// 게시글 상세 조회 - 로그인한 경우 서버가 JWT에서 userId 추출하여 좋아요 여부 포함
// 비회원도 접근 가능하며, 이 경우 서버에서 좋아요 여부를 false로 반환
export const fetchPost = (postId) => instance.get(`/api/posts/${postId}`);

// 게시글 작성 - authorId는 서버가 JWT에서 추출하므로 파라미터 제거
export const createPost = (postData) => instance.post('/api/posts', postData);

// 게시글 수정 - authorId는 서버가 JWT에서 추출
export const updatePost = (postId, postData) => instance.put(`/api/posts/${postId}`, postData);

// 게시글 삭제 - authorId는 서버가 JWT에서 추출
export const deletePost = (postId) => instance.delete(`/api/posts/${postId}`);

// 댓글 작성 - authorId는 서버가 JWT에서 추출
export const createComment = (postId, content) =>
  instance.post(`/api/posts/${postId}/comments`, { content });

// 댓글 삭제 - authorId는 서버가 JWT에서 추출
export const deleteComment = (postId, commentId) =>
  instance.delete(`/api/posts/${postId}/comments/${commentId}`);

// 좋아요 토글 - userId는 서버가 JWT에서 추출하므로 파라미터 제거
export const toggleLike = (postId) => instance.post(`/api/posts/${postId}/like`);
