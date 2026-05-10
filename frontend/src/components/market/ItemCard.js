import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';

// 서버 키 → 한국어 레이블 매핑
// 서버명은 DB에 영문 키로 저장되므로 UI 표시 시 변환 필요
const SERVER_LABELS = {
  NINAV:    '니나브',
  RUPEONE:  '루페온',
  SILIAN:   '실리안',
  AMAN:     '아만',
  ABRELSUD: '아브렐슈드',
  KADAN:    '카단',
  KAMAIN:   '카마인',
  KAJEROS:  '카제로스',
  NA:       '북미',
  EU:       '유럽',
  ETC:      '기타',
};

const CATEGORY_LABELS = {
  CURRENCY: '게임재화',
  ITEM:     '아이템',
  ETC:      '기타',
};

const STATUS_CONFIG = {
  FOR_SALE:  { label: '판매중',   color: colors.success },
  RESERVED:  { label: '예약중',   color: colors.warning },
  COMPLETED: { label: '거래완료', color: colors.textDisabled },
};

// 거래 횟수 기반 등급 계산
// 거래 경험이 신뢰의 가장 직접적인 증거이므로 tradeCount를 기준으로 삼는다
// Bronze → Silver → Gold 순으로 거래 장벽을 낮추어 신뢰 에코시스템을 형성
const getGrade = (tradeCount) => {
  if (tradeCount >= 20) return { label: '골드',  color: '#B8860B', bg: '#FFF8DC' };
  if (tradeCount >= 5)  return { label: '실버',  color: '#5F7A8A', bg: '#ECEFF1' };
  return                       { label: '브론즈', color: '#8B5A2B', bg: '#FBE9E7' };
};

// 1만 골드당 단가를 원화 형식으로 표시
// 단가 표시는 구매자가 서버 간 시세를 즉시 비교할 수 있게 하는 핵심 정보
const formatUnitPrice = (pricePerUnit) => {
  if (!pricePerUnit) return '-';
  return `${pricePerUnit.toLocaleString('ko-KR')}원`;
};

// 골드 수량을 "X만 골드" 형식으로 표시
const formatQuantity = (quantity) => {
  if (!quantity) return '-';
  return `${(quantity / 10000).toLocaleString('ko-KR')}만G`;
};

// 등록 시간: 최근은 "N분 전", 오래된 것은 날짜로 표시
const formatTime = (createdAt) => {
  if (!createdAt) return '';
  const now   = new Date();
  const past  = new Date(createdAt);
  const diffMs   = now - past;
  const diffMin  = Math.floor(diffMs / 60000);
  if (diffMin < 1)  return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay  = Math.floor(diffHour / 24);
  if (diffDay < 7)   return `${diffDay}일 전`;
  return `${past.getMonth() + 1}/${past.getDate()}`;
};

// 인증 배지 아이콘 컴포넌트
// On 상태(포인트 컬러) / Off 상태(회색)로 인증 여부를 즉각적으로 시각화
// 판매자의 신뢰 수준을 텍스트 없이 아이콘만으로 전달 → 정보 밀도 최대화
const AuthBadge = ({ iconName, active, label }) => (
  <View style={[styles.authBadge, active && styles.authBadgeActive]}>
    <Ionicons
      name={iconName}
      size={11}
      color={active ? colors.primary : colors.textDisabled}
    />
    <Text style={[styles.authLabel, active && styles.authLabelActive]}>
      {label}
    </Text>
  </View>
);

// 매물 카드 컴포넌트 - React.memo로 FlatList 스크롤 성능 최적화
const ItemCard = React.memo(({ item, onPress }) => {
  const status       = STATUS_CONFIG[item.status] || STATUS_CONFIG.FOR_SALE;
  const serverLabel  = SERVER_LABELS[item.serverName]  || item.serverName;
  const categoryLabel = CATEGORY_LABELS[item.category] || item.category;
  const grade        = getGrade(item.sellerTradeCount ?? 0);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, 1만G당 ${item.pricePerUnit?.toLocaleString()}원`}
    >
      {/* ── 상단: 태그 + 상태 + 시간 ── */}
      <View style={styles.topRow}>
        <View style={styles.tagRow}>
          <View style={styles.serverTag}>
            <Text style={styles.serverTagText}>{serverLabel}</Text>
          </View>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryTagText}>{categoryLabel}</Text>
          </View>
        </View>
        <View style={styles.rightMeta}>
          <View style={[styles.statusDot, { backgroundColor: status.color }]} />
          <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
        </View>
      </View>

      {/* ── 제목 (2줄 클리핑) ── */}
      <Text style={styles.title} numberOfLines={2}>
        {item.title}
      </Text>

      {/* ── 가격 정보 ── */}
      {/* 1만G당 단가와 총 수량을 나란히 표시 → 구매자가 총비용을 즉시 계산 가능 */}
      <View style={styles.priceRow}>
        <View style={styles.priceBlock}>
          <Text style={styles.priceSubLabel}>1만G당</Text>
          <Text style={styles.priceValue}>
            {formatUnitPrice(item.pricePerUnit)}
          </Text>
        </View>
        <View style={styles.priceDivider} />
        <View style={styles.priceBlock}>
          <Text style={styles.priceSubLabel}>총 수량</Text>
          <Text style={styles.quantityValue}>
            {formatQuantity(item.quantity)}
          </Text>
        </View>
        <View style={styles.priceDivider} />
        <View style={styles.priceBlock}>
          <Text style={styles.priceSubLabel}>예상 금액</Text>
          <Text style={styles.totalValue}>
            {item.pricePerUnit && item.quantity
              ? `${((item.pricePerUnit * item.quantity) / 10000).toLocaleString('ko-KR')}원`
              : '-'}
          </Text>
          {/* 최소 판매 골드: 등록된 경우에만 예상금액 아래에 표시
              구매자가 거래 가능 여부를 목록에서 즉시 판단할 수 있도록 노출 */}
          {!!item.minQuantity && (
            <Text style={styles.minQuantityText}>
              최소 {(item.minQuantity / 10000).toLocaleString()}만G
              {item.pricePerUnit
                ? ` · ${((item.pricePerUnit * item.minQuantity) / 10000).toLocaleString()}원`
                : ''}
            </Text>
          )}
        </View>
      </View>

      {/* ── 판매자 신뢰 정보 ── */}
      {/* 등급·인증 배지를 카드 하단에 고정 배치하여
          목록 스캔 중 시선이 자연스럽게 신뢰 지표로 이동하도록 유도 */}
      <View style={styles.sellerRow}>
        {/* 거래 등급 뱃지 */}
        <View style={[styles.gradeBadge, { backgroundColor: grade.bg }]}>
          <Text style={[styles.gradeText, { color: grade.color }]}>
            {grade.label}
          </Text>
        </View>

        <Text style={styles.sellerNickname} numberOfLines={1}>
          {item.sellerNickname}
        </Text>

        {/* 인증 배지 3종: 본인(ID) / 휴대폰 / 계좌 */}
        <View style={styles.authRow}>
          <AuthBadge
            iconName="id-card-outline"
            active={item.sellerIdentityVerified}
            label="본인인증"
          />
          <AuthBadge
            iconName="phone-portrait-outline"
            active={item.sellerPhoneVerified}
            label="폰"
          />
          <AuthBadge
            iconName="card-outline"
            active={item.sellerBankVerified}
            label="계좌"
          />
        </View>

        {/* 신뢰 점수 */}
        <Text style={[
          styles.scoreText,
          { color: item.sellerReliabilityScore >= 36.5 ? colors.success : colors.warning },
        ]}>
          {item.sellerReliabilityScore?.toFixed(1)}°
        </Text>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 12,           // spec: 내부 패딩 12px
    marginHorizontal: 12,
    marginBottom: 8,       // spec: 카드 간 여백 8px
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
    gap: 8,
  },

  // 상단 행
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tagRow: {
    flexDirection: 'row',
    gap: 5,
  },
  serverTag: {
    backgroundColor: colors.secondary + '15',
    borderRadius: borderRadius.sm,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  serverTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondary,
  },
  categoryTag: {
    backgroundColor: colors.primary + '15',
    borderRadius: borderRadius.sm,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  categoryTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  rightMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  timeText: {
    fontSize: 11,
    color: colors.textDisabled,
  },

  // 제목
  title: {
    ...typography.sectionTitle,
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 21,
  },

  // 가격 행
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  priceBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  priceDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },
  priceSubLabel: {
    fontSize: 10,
    color: colors.textDisabled,
    fontWeight: '500',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,      // 포인트 컬러로 단가 강조
  },
  quantityValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondary,    // 네이비로 총금액 표시 (신뢰/안정감)
  },
  minQuantityText: {
    fontSize: 9,
    fontWeight: '500',
    color: colors.primary,
    marginTop: 1,
  },

  // 판매자 행
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gradeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  gradeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  sellerNickname: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
    fontWeight: '500',
  },
  authRow: {
    flexDirection: 'row',
    gap: 3,
  },
  authBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  authBadgeActive: {
    backgroundColor: colors.primary + '18',
  },
  authLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.textDisabled,
  },
  authLabelActive: {
    color: colors.primary,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

export default ItemCard;
