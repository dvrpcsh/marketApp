import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { formatPrice } from '../../utils/formatPrice';
import { formatRelativeDate } from '../../utils/formatDate';

// 매물 목록에서 각 아이템을 표시하는 카드 컴포넌트
// React.memo로 감싸 FlatList 스크롤 시 변경되지 않은 카드의 불필요한 리렌더링 방지
const ItemCard = React.memo(({ item, onPress }) => {
  // 판매 상태를 한국어 레이블과 색상으로 매핑
  // → 영문 Enum값(FOR_SALE)을 사용자에게 직접 노출하지 않기 위한 처리
  const statusConfig = {
    FOR_SALE:  { label: '판매중',  color: colors.success },
    RESERVED:  { label: '예약중',  color: colors.warning },
    COMPLETED: { label: '거래완료', color: colors.textDisabled },
  };
  const status = statusConfig[item.status] || statusConfig.FOR_SALE;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${formatPrice(item.price)}`}
    >
      {/* 와이어프레임 단계: 이미지 플레이스홀더 - 추후 expo-image로 교체 */}
      <View style={styles.imagePlaceholder}>
        <Text style={styles.imagePlaceholderText}>📦</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: `${status.color}22` }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        {/* 서버명 - 같은 아이템도 서버마다 시세가 달라 구매자에게 중요한 정보 */}
        <Text style={styles.serverName}>{item.serverName}</Text>

        {/* 가격: 토스 스타일 - 구매 결정의 핵심이므로 가장 크고 굵게 표시 */}
        <Text style={styles.price}>{formatPrice(item.price)}</Text>

        <View style={styles.footer}>
          {/* 판매자 신뢰 점수 - 구매자가 거래 전 판매자 신뢰도를 한눈에 파악 */}
          <Text style={styles.sellerInfo}>
            {item.sellerNickname} · 신뢰 {item.sellerReliabilityScore?.toFixed(1)}
          </Text>
          <Text style={styles.date}>{formatRelativeDate(item.createdAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  imagePlaceholderText: {
    fontSize: 28,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: spacing.xs,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  serverName: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  price: {
    ...typography.price,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sellerInfo: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  date: {
    ...typography.caption,
    color: colors.textDisabled,
  },
});

export default ItemCard;
