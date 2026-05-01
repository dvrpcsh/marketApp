import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchPost, toggleLike, createComment, deleteComment } from '../api/communityApi';
import { formatRelativeDate } from '../utils/formatDate';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

const CATEGORY_LABEL = { PRICE_INFO: '시세', LFG: 'LFG', FREE: '자유' };
const getScoreColor = (score) => (score >= 36.5 ? colors.success : colors.warning);

// 게시글 상세 화면
// ListHeaderComponent로 게시글 본문을 FlatList 헤더에 배치
// → 댓글과 게시글이 하나의 스크롤 컨테이너에서 자연스럽게 이어짐
const PostDetailScreen = ({ route, navigation }) => {
  const { postId, userId } = route.params;

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentInput, setCommentInput] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const inputRef = useRef(null);

  const loadPost = useCallback(async () => {
    try {
      const data = await fetchPost(postId, userId);
      setPost(data);
      navigation.setOptions({ title: data.title.length > 20 ? data.title.slice(0, 20) + '…' : data.title });
    } catch (e) {
      Alert.alert('오류', e.message);
    } finally {
      setLoading(false);
    }
  }, [postId, userId]);

  React.useEffect(() => {
    loadPost();
  }, [loadPost]);

  // 좋아요 토글 - 낙관적 UI 업데이트: API 응답 전에 UI를 먼저 반영하여 반응성 향상
  const handleLike = useCallback(async () => {
    if (!post) return;
    const prevLiked = post.isLiked;
    const prevCount = post.likeCount;

    // 낙관적 업데이트: 즉시 UI 반영
    setPost(p => ({ ...p, isLiked: !p.isLiked, likeCount: p.isLiked ? p.likeCount - 1 : p.likeCount + 1 }));

    try {
      const result = await toggleLike(postId, userId);
      // 서버 응답으로 정확한 값 동기화
      setPost(p => ({ ...p, isLiked: result.liked, likeCount: result.likeCount }));
    } catch (e) {
      // 실패 시 롤백
      setPost(p => ({ ...p, isLiked: prevLiked, likeCount: prevCount }));
      Alert.alert('오류', '좋아요 처리에 실패했습니다.');
    }
  }, [post, postId, userId]);

  // 댓글 작성
  const handleCommentSubmit = useCallback(async () => {
    const text = commentInput.trim();
    if (!text) return;

    setCommentLoading(true);
    try {
      const newComment = await createComment(postId, userId, text);
      setPost(p => ({
        ...p,
        comments: [...(p.comments || []), newComment],
        commentCount: p.commentCount + 1,
      }));
      setCommentInput('');
      inputRef.current?.blur();
    } catch (e) {
      Alert.alert('오류', e.message);
    } finally {
      setCommentLoading(false);
    }
  }, [commentInput, postId, userId]);

  // 댓글 삭제 (작성자 본인만)
  const handleDeleteComment = useCallback((commentId, authorId) => {
    if (authorId !== userId) return;
    Alert.alert('댓글 삭제', '이 댓글을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteComment(postId, commentId, userId);
            setPost(p => ({
              ...p,
              comments: p.comments.filter(c => c.commentId !== commentId),
              commentCount: p.commentCount - 1,
            }));
          } catch (e) {
            Alert.alert('오류', e.message);
          }
        },
      },
    ]);
  }, [postId, userId]);

  const renderComment = useCallback(({ item: comment }) => (
    <View style={styles.commentItem}>
      <View style={styles.commentHeader}>
        <View style={styles.commentAuthorRow}>
          <Text style={styles.commentAuthor}>{comment.authorNickname}</Text>
          {/* 댓글에도 신뢰 점수 배지 - 커뮤니티 정보 신뢰도 판단 지원 */}
          <View style={[styles.commentScoreBadge, { backgroundColor: getScoreColor(comment.authorReliabilityScore) + '1A' }]}>
            <Text style={[styles.commentScore, { color: getScoreColor(comment.authorReliabilityScore) }]}>
              {comment.authorReliabilityScore?.toFixed(1)}°
            </Text>
          </View>
        </View>
        <View style={styles.commentMeta}>
          <Text style={styles.commentDate}>{formatRelativeDate(comment.createdAt)}</Text>
          {comment.authorId === userId && (
            <TouchableOpacity onPress={() => handleDeleteComment(comment.commentId, comment.authorId)}>
              <Text style={styles.deleteBtn}>삭제</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <Text style={styles.commentContent}>{comment.content}</Text>
    </View>
  ), [userId, handleDeleteComment]);

  // 게시글 본문 - FlatList의 ListHeaderComponent로 배치
  const renderHeader = useCallback(() => {
    if (!post) return null;
    return (
      <View style={styles.postContainer}>
        {/* 카테고리 + 작성자 */}
        <View style={styles.postMeta}>
          <Text style={[styles.categoryLabel, { color: colors.info }]}>
            {CATEGORY_LABEL[post.category] || post.category}
          </Text>
          <View style={styles.postAuthorRow}>
            <Text style={styles.postAuthor}>{post.authorNickname}</Text>
            <View style={[styles.postScoreBadge, { backgroundColor: getScoreColor(post.authorReliabilityScore) + '15' }]}>
              <Text style={[styles.postScore, { color: getScoreColor(post.authorReliabilityScore) }]}>
                {post.authorReliabilityScore?.toFixed(1)}°
              </Text>
            </View>
          </View>
          <Text style={styles.postDate}>{formatRelativeDate(post.createdAt)}</Text>
        </View>

        {/* 제목 + 본문 */}
        <Text style={styles.postTitle}>{post.title}</Text>
        <Text style={styles.postContent}>{post.content}</Text>

        {/* 좋아요 + 통계 */}
        <View style={styles.postActions}>
          <TouchableOpacity
            style={[styles.likeButton, post.isLiked && styles.likeButtonActive]}
            onPress={handleLike}
            activeOpacity={0.7}
          >
            <Text style={[styles.likeIcon, post.isLiked && styles.likeIconActive]}>
              {post.isLiked ? '♥' : '♡'}
            </Text>
            <Text style={[styles.likeCount, post.isLiked && styles.likeCountActive]}>
              {post.likeCount}
            </Text>
          </TouchableOpacity>
          <Text style={styles.viewStat}>👁 {post.viewCount}</Text>
        </View>

        {/* 댓글 섹션 헤더 */}
        <View style={styles.commentSectionHeader}>
          <Text style={styles.commentSectionTitle}>댓글 {post.commentCount}</Text>
        </View>
      </View>
    );
  }, [post, handleLike]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          data={post?.comments || []}
          keyExtractor={(item) => String(item.commentId)}
          renderItem={renderComment}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.commentDivider} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyComments}>
              <Text style={styles.emptyCommentsText}>첫 댓글을 남겨보세요 💬</Text>
            </View>
          }
        />

        {/* 댓글 입력창 */}
        <View style={styles.commentInputContainer}>
          <TextInput
            ref={inputRef}
            style={styles.commentTextInput}
            value={commentInput}
            onChangeText={setCommentInput}
            placeholder="댓글을 입력하세요..."
            placeholderTextColor={colors.textDisabled}
            multiline={false}
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.submitButton, !commentInput.trim() && styles.submitButtonDisabled]}
            onPress={handleCommentSubmit}
            disabled={!commentInput.trim() || commentLoading}
            activeOpacity={0.7}
          >
            {commentLoading
              ? <ActivityIndicator size="small" color={colors.textInverse} />
              : <Text style={styles.submitButtonText}>등록</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingBottom: spacing.md },
  // 게시글 본문
  postContainer: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  postMeta: { gap: spacing.xs, marginBottom: spacing.md },
  categoryLabel: { fontSize: 13, fontWeight: '600' },
  postAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  postAuthor: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  postScoreBadge: {
    paddingHorizontal: spacing.xs, paddingVertical: 1, borderRadius: 4,
  },
  postScore: { fontSize: 11, fontWeight: '700' },
  postDate: { ...typography.caption, color: colors.textDisabled },
  postTitle: { ...typography.screenTitle, color: colors.textPrimary, marginBottom: spacing.md },
  postContent: { ...typography.body, color: colors.textPrimary, lineHeight: 24, marginBottom: spacing.lg },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  likeButtonActive: { borderColor: colors.error, backgroundColor: colors.error + '0D' },
  likeIcon: { fontSize: 16, color: colors.textSecondary },
  likeIconActive: { color: colors.error },
  likeCount: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  likeCountActive: { color: colors.error },
  viewStat: { ...typography.caption, color: colors.textDisabled },
  // 댓글 섹션
  commentSectionHeader: {
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.xs,
  },
  commentSectionTitle: { ...typography.sectionTitle, color: colors.textPrimary, fontSize: 15 },
  commentDivider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.md },
  commentItem: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commentAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  commentAuthor: { ...typography.caption, color: colors.textPrimary, fontWeight: '600' },
  commentScoreBadge: { paddingHorizontal: spacing.xs, paddingVertical: 1, borderRadius: 4 },
  commentScore: { fontSize: 11, fontWeight: '700' },
  commentMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  commentDate: { ...typography.caption, color: colors.textDisabled },
  deleteBtn: { ...typography.caption, color: colors.error },
  commentContent: { ...typography.body, color: colors.textPrimary, lineHeight: 20 },
  emptyComments: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyCommentsText: { ...typography.body, color: colors.textDisabled },
  // 댓글 입력창
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  commentTextInput: {
    flex: 1,
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.textPrimary,
    maxHeight: 80,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: { backgroundColor: colors.border },
  submitButtonText: { ...typography.button, color: colors.textInverse, fontSize: 14 },
});

export default PostDetailScreen;
