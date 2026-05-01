import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { formatRelativeDate } from '../../utils/formatDate';

// 카테고리 한국어 레이블 + 색상 매핑
const CATEGORY_CONFIG = {
  PRICE_INFO: { label: '시세', color: colors.info },
  LFG:        { label: 'LFG', color: colors.accent },
  FREE:       { label: '자유', color: colors.primary },
};

// 신뢰 점수에 따른 색상 - 매매 화면과 동일한 기준(36.5) 적용
// 커뮤니티에서도 신뢰받는 유저가 눈에 띄도록 → 양질의 정보 제공 유저 자연스럽게 부각
const getScoreColor = (score) => (score >= 36.5 ? colors.success : colors.warning);

// React.memo로 감싸 FlatList 스크롤 시 변경되지 않은 카드 리렌더링 방지
const PostCard = React.memo(({ post, onPress }) => {
  const category = CATEGORY_CONFIG[post.category] || CATEGORY_CONFIG.FREE;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={post.title}
    >
      {/* 카테고리 배지 + 작성자 신뢰 점수 */}
      <View style={styles.topRow}>
        <View style={[styles.categoryBadge, { backgroundColor: category.color + '1A' }]}>
          <Text style={[styles.categoryText, { color: category.color }]}>{category.label}</Text>
        </View>
        <View style={styles.authorRow}>
          <Text style={styles.authorName}>{post.authorNickname}</Text>
          {/* 신뢰 점수 배지 - 커뮤니티에서도 거래 신뢰도 높은 유저 강조 */}
          <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(post.authorReliabilityScore) + '1A' }]}>
            <Text style={[styles.scoreText, { color: getScoreColor(post.authorReliabilityScore) }]}>
              {post.authorReliabilityScore?.toFixed(1)}°
            </Text>
          </View>
        </View>
      </View>

      {/* 제목 */}
      <Text style={styles.title} numberOfLines={2}>{post.title}</Text>

      {/* 통계 + 시간 */}
      <View style={styles.bottomRow}>
        <View style={styles.statsRow}>
          <Text style={styles.stat}>💬 {post.commentCount}</Text>
          <Text style={styles.stat}>♥ {post.likeCount}</Text>
          <Text style={styles.stat}>👁 {post.viewCount}</Text>
        </View>
        <Text style={styles.date}>{formatRelativeDate(post.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  authorName: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  scoreBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: 4,
  },
  scoreText: {
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
    fontSize: 16,
    lineHeight: 22,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  stat: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  date: {
    ...typography.caption,
    color: colors.textDisabled,
  },
});

export default PostCard;
