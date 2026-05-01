import instance from './instance';

// 게시글 목록 조회
// category: PRICE_INFO | LFG | FREE | undefined(전체)
// sort: latest(기본) | popular(인기순)
export const fetchPosts = (category, sort = 'latest', page = 0, size = 20) => {
  const params = { sort, page, size };
  if (category) params.category = category;
  return instance.get('/api/posts', { params });
};

// 게시글 상세 조회 - 댓글 목록 + 좋아요 여부 포함
export const fetchPost = (postId, userId) => {
  const params = userId ? { userId } : {};
  return instance.get(`/api/posts/${postId}`, { params });
};

// 게시글 작성 - JWT 도입 후 authorId 제거 예정
export const createPost = (authorId, postData) =>
  instance.post(`/api/posts?authorId=${authorId}`, postData);

// 게시글 수정 - 작성자 본인만 가능
export const updatePost = (postId, authorId, postData) =>
  instance.put(`/api/posts/${postId}?authorId=${authorId}`, postData);

// 게시글 삭제 - 작성자 본인만 가능
export const deletePost = (postId, authorId) =>
  instance.delete(`/api/posts/${postId}?authorId=${authorId}`);

// 댓글 작성
export const createComment = (postId, authorId, content) =>
  instance.post(`/api/posts/${postId}/comments?authorId=${authorId}`, { content });

// 댓글 삭제
export const deleteComment = (postId, commentId, authorId) =>
  instance.delete(`/api/posts/${postId}/comments/${commentId}?authorId=${authorId}`);

// 좋아요 토글 - 응답: { liked: boolean, likeCount: number }
export const toggleLike = (postId, userId) =>
  instance.post(`/api/posts/${postId}/like?userId=${userId}`);
