import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { formatRelativeDate } from '../../utils/formatDate';

const STATUS_CONFIG = {
  FOR_SALE:  { label: '판매중',   color: colors.success },
  RESERVED:  { label: '예약중',   color: colors.warning },
  COMPLETED: { label: '거래완료', color: colors.textDisabled },
};

const CATEGORY_LABEL = {
  CURRENCY: '게임재화',
  ITEM:     '아이템',
  ETC:      '기타',
};

// 골드 수량을 "X만 골드" 형식으로 표시 - 수량은 항상 1만 단위로 등록되므로 만 단위 변환
const formatQuantity = (quantity) => {
  if (!quantity) return '-';
  const man = quantity / 10000;
  return `${man.toLocaleString('ko-KR')}만 골드`;
};

const ItemCard = React.memo(({ item, onPress }) => {
  const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.FOR_SALE;
  const categoryLabel = CATEGORY_LABEL[item.category] || item.category;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${formatQuantity(item.quantity)}`}
    >
      <View style={styles.imagePlaceholder}>
        <Text style={styles.imagePlaceholderText}>📦</Text>
      </View>

      <View style={styles.content}>
        {/* 제목 + 상태 뱃지 */}
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: `${status.color}22` }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        {/* 서버명 · 물품 종류 */}
        <Text style={styles.meta}>{item.serverName}  ·  {categoryLabel}</Text>

        {/* 판매 수량 - 구매 결정의 핵심이므로 굵고 크게 */}
        <Text style={styles.quantity}>{formatQuantity(item.quantity)}</Text>

        {/* 판매자 정보 + 등록일 */}
        <View style={styles.footer}>
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
    justifyContent: 'space-between',
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
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  quantity: {
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
