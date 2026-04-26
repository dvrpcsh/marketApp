import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { fetchItemDetail } from '../api/itemApi';
import { formatPrice } from '../utils/formatPrice';
import { formatRelativeDate } from '../utils/formatDate';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

// 매물 상세 화면 - 구매 결정에 필요한 모든 정보를 한 화면에서 제공
// 판매자 신뢰 점수(36.5 기준)를 눈에 띄게 노출하여 마켓앱의 핵심 가치인 '신뢰'를 강조
const ItemDetailScreen = ({ route, navigation }) => {
  const { itemId } = route.params;
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 화면 진입 시 itemId로 상세 정보 로드 - seller 정보도 함께 반환됨 (백엔드 JOIN FETCH)
    const load = async () => {
      try {
        const data = await fetchItemDetail(itemId);
        setItem(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [itemId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !item) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error || '매물 정보를 불러올 수 없습니다.'}</Text>
      </View>
    );
  }

  // 카테고리 한국어 매핑 - 백엔드 Enum값을 사용자 친화적 레이블로 변환
  const categoryLabel = {
    CHARACTER: '캐릭터',
    ITEM: '아이템/장비',
    CURRENCY: '게임 재화',
    ACCOUNT: '계정',
    BOOSTING: '육성 서비스',
    OTHER: '기타',
  }[item.category] || item.category;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* 이미지 영역 - 와이어프레임 단계 플레이스홀더 */}
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderText}>📦</Text>
          <Text style={styles.imagePlaceholderLabel}>상품 이미지</Text>
        </View>

        <View style={styles.body}>

          {/* 매물 기본 정보 */}
          <View style={styles.section}>
            <View style={styles.categoryRow}>
              <Text style={styles.categoryText}>{categoryLabel}</Text>
              <Text style={styles.serverText}>· {item.serverName} 서버</Text>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            {/* 가격: 거래의 핵심이므로 토스 스타일로 가장 크게 강조 */}
            <Text style={styles.price}>{formatPrice(item.price)}</Text>
            <Text style={styles.date}>{formatRelativeDate(item.createdAt)}</Text>
          </View>

          <View style={styles.divider} />

          {/* 판매자 신뢰 정보 - 마켓앱의 핵심 가치 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>판매자 정보</Text>
            <View style={styles.sellerCard}>
              <View style={styles.sellerInfo}>
                <Text style={styles.sellerNickname}>{item.sellerNickname}</Text>
                {/* 신뢰 점수 36.5 기준 - 기준치 이상이면 초록, 미만이면 주황으로 강조 */}
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreLabel}>신뢰 점수</Text>
                  <Text
                    style={[
                      styles.scoreValue,
                      { color: item.sellerReliabilityScore >= 36.5 ? colors.success : colors.warning },
                    ]}
                  >
                    {item.sellerReliabilityScore?.toFixed(1)}
                  </Text>
                </View>
                <Text style={styles.tradeCount}>
                  거래 {item.sellerTradeCount ?? 0}회 완료
                </Text>
              </View>
              {/* 추후 캐릭터 인증 완료 시 배지 표시 - 현재는 플레이스홀더 */}
              <Badge label="인증 준비중" variant="warning" />
            </View>
          </View>

          {item.description && (
            <>
              <View style={styles.divider} />
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>상품 설명</Text>
                <Text style={styles.description}>{item.description}</Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* 하단 고정 CTA - 채팅하기 버튼 */}
      <View style={styles.footer}>
        <Text style={styles.footerPrice}>{formatPrice(item.price)}</Text>
        <Button
          title="채팅으로 거래하기"
          onPress={() => {/* TODO: 채팅 화면으로 이동 */}}
          style={styles.ctaButton}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  imagePlaceholder: {
    height: 260,
    backgroundColor: colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontSize: 60,
    marginBottom: spacing.sm,
  },
  imagePlaceholderLabel: {
    ...typography.caption,
    color: colors.textDisabled,
  },
  body: {
    backgroundColor: colors.surface,
  },
  section: {
    padding: spacing.md,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  categoryText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  serverText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  title: {
    ...typography.screenTitle,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  price: {
    ...typography.price,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  date: {
    ...typography.caption,
    color: colors.textDisabled,
  },
  divider: {
    height: 8,
    backgroundColor: colors.background,
  },
  sellerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  sellerInfo: {
    gap: spacing.xs,
  },
  sellerNickname: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  scoreLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  tradeCount: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  description: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  footerPrice: {
    ...typography.price,
    color: colors.textPrimary,
    flex: 1,
  },
  ctaButton: {
    flex: 2,
  },
});

export default ItemDetailScreen;
