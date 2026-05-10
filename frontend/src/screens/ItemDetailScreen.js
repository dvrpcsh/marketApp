import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/common/Button';
import { fetchItemDetail } from '../api/itemApi';
import { findOrCreateChatRoom } from '../api/chatApi';
import { tokenStorage } from '../utils/tokenStorage';
import { formatRelativeDate } from '../utils/formatDate';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

// ── 상수 매핑 ────────────────────────────────────────────────────────────────

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

const GAME_LABELS   = { LOST_ARK: '로스트아크' };
const CATEGORY_LABEL = { CURRENCY: '게임재화', ITEM: '아이템', ETC: '기타' };

const STATUS_CONFIG = {
  FOR_SALE:  { label: '판매중',   color: colors.success },
  RESERVED:  { label: '예약중',   color: colors.warning },
  COMPLETED: { label: '거래완료', color: colors.textDisabled },
};

// 거래 횟수 기반 등급 (ItemCard와 동일 기준)
const getGrade = (tradeCount) => {
  if (tradeCount >= 20) return { label: '골드',  color: '#B8860B', bg: '#FFF8DC' };
  if (tradeCount >= 5)  return { label: '실버',  color: '#5F7A8A', bg: '#ECEFF1' };
  return                       { label: '브론즈', color: '#8B5A2B', bg: '#FBE9E7' };
};

// ── 서브 컴포넌트 ────────────────────────────────────────────────────────────

// 인증 배지 (ItemCard와 동일 UI 패턴, 상세 페이지에 맞게 크기 조금 큼)
const AuthBadge = ({ iconName, active, label }) => (
  <View style={[styles.authBadge, active && styles.authBadgeActive]}>
    <Ionicons
      name={iconName}
      size={13}
      color={active ? colors.primary : colors.textDisabled}
    />
    <Text style={[styles.authLabel, active && styles.authLabelActive]}>
      {label}
    </Text>
  </View>
);

// 가격 정보 행
const PriceRow = ({ label, value, valueStyle, sub }) => (
  <View style={styles.priceInfoRow}>
    <Text style={styles.priceInfoLabel}>{label}</Text>
    <View style={styles.priceInfoRight}>
      <Text style={[styles.priceInfoValue, valueStyle]}>{value}</Text>
      {sub ? <Text style={styles.priceInfoSub}>{sub}</Text> : null}
    </View>
  </View>
);

// ── 메인 컴포넌트 ────────────────────────────────────────────────────────────

const ItemDetailScreen = ({ route, navigation }) => {
  const { itemId } = route.params;
  const [item, setItem]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
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

  // 채팅 버튼 핸들러
  // 1단계: 로그인 여부 → 2단계: 내 매물 여부 → 3단계: 채팅방 생성
  const handleChatPress = useCallback(async () => {
    if (!item) return;

    const token = await tokenStorage.getAccessToken();
    if (!token) {
      Alert.alert(
        '로그인이 필요합니다',
        '마켓 서비스를 이용하시려면 로그인이 필요합니다.',
        [
          { text: '취소', style: 'cancel' },
          { text: '로그인하기', onPress: () => navigation.navigate('Login') },
        ],
      );
      return;
    }

    const currentUserId = await tokenStorage.getUserId();
    if (item.sellerId === currentUserId) {
      Alert.alert('안내', '내 매물에는 채팅을 시작할 수 없습니다.');
      return;
    }

    setChatLoading(true);
    try {
      const room = await findOrCreateChatRoom(currentUserId, item.sellerId, itemId);
      navigation.navigate('ChatRoom', {
        roomId: room.roomId,
        itemId,
        itemTitle: item.title,
        currentUserId,
        sellerId: item.sellerId,
      });
    } catch (e) {
      Alert.alert('오류', e.message || '채팅방을 열 수 없습니다. 다시 시도해주세요.');
    } finally {
      setChatLoading(false);
    }
  }, [item, itemId, navigation]);

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

  // 파생 값 계산
  const serverLabel   = SERVER_LABELS[item.serverName]  || item.serverName;
  const gameLabel     = GAME_LABELS[item.gameName]      || item.gameName;
  const categoryLabel = CATEGORY_LABEL[item.category]   || item.category;
  const status        = STATUS_CONFIG[item.status]      || STATUS_CONFIG.FOR_SALE;
  const grade         = getGrade(item.sellerTradeCount  ?? 0);

  const totalPrice = item.pricePerUnit && item.quantity
    ? ((item.pricePerUnit * item.quantity) / 10000).toLocaleString('ko-KR')
    : null;

  const minPrice = item.minQuantity && item.pricePerUnit
    ? ((item.pricePerUnit * item.minQuantity) / 10000).toLocaleString('ko-KR')
    : null;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* 이미지 플레이스홀더 */}
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderText}>📦</Text>
          <Text style={styles.imagePlaceholderLabel}>상품 이미지</Text>
        </View>

        <View style={styles.body}>

          {/* ── 매물 기본 정보 ── */}
          <View style={styles.section}>

            {/* 태그 행: 서버·카테고리·상태 */}
            <View style={styles.tagRow}>
              <View style={styles.serverTag}>
                <Text style={styles.serverTagText}>{serverLabel}</Text>
              </View>
              <View style={styles.categoryTag}>
                <Text style={styles.categoryTagText}>{categoryLabel}</Text>
              </View>
              <View style={[styles.statusTag, { borderColor: status.color }]}>
                <Text style={[styles.statusTagText, { color: status.color }]}>
                  {status.label}
                </Text>
              </View>
            </View>

            {/* 게임명 */}
            <Text style={styles.gameName}>{gameLabel}</Text>

            {/* 제목 */}
            <Text style={styles.title}>{item.title}</Text>

            {/* 등록 시각 */}
            <Text style={styles.date}>{formatRelativeDate(item.createdAt)}</Text>
          </View>

          <View style={styles.divider} />

          {/* ── 가격·수량 정보 ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>거래 정보</Text>

            <View style={styles.priceCard}>
              <PriceRow
                label="1만 골드당"
                value={`${item.pricePerUnit?.toLocaleString('ko-KR')}원`}
                valueStyle={styles.unitPriceHighlight}
              />
              <View style={styles.priceRowDivider} />
              <PriceRow
                label="총 판매 수량"
                value={`${(item.quantity / 10000).toLocaleString('ko-KR')}만 골드`}
              />
              {/* 최소 구매 수량: 등록된 경우에만 표시 */}
              {item.minQuantity && (
                <>
                  <View style={styles.priceRowDivider} />
                  <PriceRow
                    label="최소 구매"
                    value={`${(item.minQuantity / 10000).toLocaleString('ko-KR')}만 골드`}
                    sub={minPrice ? `${minPrice}원~` : null}
                    valueStyle={{ color: colors.primary }}
                  />
                </>
              )}
              {totalPrice && (
                <>
                  <View style={styles.priceRowDivider} />
                  <PriceRow
                    label="예상 총금액"
                    value={`${totalPrice}원`}
                    valueStyle={{ color: colors.secondary, fontWeight: '700' }}
                  />
                </>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          {/* ── 판매자 신뢰 정보 ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>판매자 정보</Text>

            <View style={styles.sellerCard}>
              {/* 닉네임 + 등급 */}
              <View style={styles.sellerTopRow}>
                <Text style={styles.sellerNickname}>{item.sellerNickname}</Text>
                <View style={[styles.gradeBadge, { backgroundColor: grade.bg }]}>
                  <Text style={[styles.gradeText, { color: grade.color }]}>
                    {grade.label}
                  </Text>
                </View>
              </View>

              {/* 신뢰 점수 + 거래 횟수 */}
              <View style={styles.sellerStatRow}>
                <View style={styles.sellerStat}>
                  <Text style={styles.sellerStatLabel}>신뢰 점수</Text>
                  <Text style={[
                    styles.sellerStatValue,
                    { color: item.sellerReliabilityScore >= 36.5 ? colors.success : colors.warning },
                  ]}>
                    {item.sellerReliabilityScore?.toFixed(1)}°
                  </Text>
                </View>
                <View style={styles.sellerStatDivider} />
                <View style={styles.sellerStat}>
                  <Text style={styles.sellerStatLabel}>거래 완료</Text>
                  <Text style={styles.sellerStatValue}>
                    {item.sellerTradeCount ?? 0}회
                  </Text>
                </View>
              </View>

              {/* 인증 배지 3종 */}
              <View style={styles.authRow}>
                <AuthBadge
                  iconName="id-card-outline"
                  active={item.sellerIdentityVerified}
                  label="본인인증"
                />
                <AuthBadge
                  iconName="phone-portrait-outline"
                  active={item.sellerPhoneVerified}
                  label="휴대폰"
                />
                <AuthBadge
                  iconName="card-outline"
                  active={item.sellerBankVerified}
                  label="계좌"
                />
              </View>
            </View>
          </View>

          {/* ── 상품 설명 ── */}
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

      {/* 하단 고정 CTA */}
      <View style={styles.footer}>
        <View style={styles.footerPriceBlock}>
          <Text style={styles.footerUnitPrice}>
            1만G · {item.pricePerUnit?.toLocaleString('ko-KR')}원
          </Text>
          <Text style={styles.footerQuantity}>
            총 {(item.quantity / 10000).toLocaleString('ko-KR')}만G
          </Text>
        </View>
        <Button
          title="채팅으로 거래하기"
          onPress={handleChatPress}
          loading={chatLoading}
          style={styles.ctaButton}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  scrollContent: { paddingBottom: 100 },

  // 이미지
  imagePlaceholder: {
    height: 220,
    backgroundColor: colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: { fontSize: 56, marginBottom: spacing.sm },
  imagePlaceholderLabel: { ...typography.caption, color: colors.textDisabled },

  body: { backgroundColor: colors.surface },

  section: { padding: spacing.md, gap: spacing.sm },

  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
  },

  divider: { height: 8, backgroundColor: colors.background },

  // 태그 행
  tagRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  serverTag: {
    backgroundColor: colors.secondary + '15',
    borderRadius: borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  serverTagText: { fontSize: 12, fontWeight: '700', color: colors.secondary },
  categoryTag: {
    backgroundColor: colors.primary + '15',
    borderRadius: borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryTagText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  statusTag: {
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusTagText: { fontSize: 12, fontWeight: '600' },

  // 기본 정보
  gameName: { ...typography.caption, color: colors.textSecondary, fontWeight: '500' },
  title: { ...typography.screenTitle, color: colors.textPrimary, lineHeight: 28 },
  date: { ...typography.caption, color: colors.textDisabled },

  // 가격 카드
  priceCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  priceInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  priceRowDivider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.md },
  priceInfoLabel: { ...typography.body, color: colors.textSecondary },
  priceInfoRight: { alignItems: 'flex-end', gap: 2 },
  priceInfoValue: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  priceInfoSub: { ...typography.caption, color: colors.textSecondary },
  unitPriceHighlight: { fontSize: 18, fontWeight: '700', color: colors.primary },

  // 판매자 카드
  sellerCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  sellerTopRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sellerNickname: { ...typography.sectionTitle, color: colors.textPrimary, flex: 1 },
  gradeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  gradeText: { fontSize: 11, fontWeight: '800' },

  sellerStatRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  sellerStat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: 4,
  },
  sellerStatDivider: { width: 1, backgroundColor: colors.border },
  sellerStatLabel: { ...typography.caption, color: colors.textSecondary },
  sellerStatValue: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },

  // 인증 배지
  authRow: { flexDirection: 'row', gap: spacing.sm },
  authBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.border,
    flex: 1,
    justifyContent: 'center',
  },
  authBadgeActive: { backgroundColor: colors.primary + '18' },
  authLabel: { fontSize: 11, fontWeight: '600', color: colors.textDisabled },
  authLabelActive: { color: colors.primary },

  // 상품 설명
  description: { ...typography.body, color: colors.textPrimary, lineHeight: 22 },

  errorText: { ...typography.body, color: colors.error, textAlign: 'center' },

  // 하단 고정 CTA
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
  footerPriceBlock: { gap: 2 },
  footerUnitPrice: { fontSize: 15, fontWeight: '700', color: colors.primary },
  footerQuantity: { ...typography.caption, color: colors.textSecondary },
  ctaButton: { flex: 1 },
});

export default ItemDetailScreen;
