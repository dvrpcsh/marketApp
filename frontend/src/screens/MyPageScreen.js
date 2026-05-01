import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Button from '../components/common/Button';
import { fetchUserProfile } from '../api/userApi';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

// JWT 도입 후 토큰에서 자동 추출 예정 - 현재는 테스트용 임시 사용자 ID
const TEMP_USER_ID = 1;

// 내 정보 화면
// useFocusEffect: 거래 완료 후 채팅방에서 이 탭으로 돌아올 때 자동으로 신뢰 점수를 재조회
// → 별도 상태 관리 없이도 항상 최신 점수가 표시됨
const MyPageScreen = ({ navigation }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // 탭에 포커스될 때마다 프로필 재조회
  // 거래 완료 직후 이 탭을 누르면 바로 반영된 신뢰 점수 확인 가능
  useFocusEffect(
    useCallback(() => {
      const loadProfile = async () => {
        setLoading(true);
        try {
          const data = await fetchUserProfile(TEMP_USER_ID);
          setProfile(data);
        } catch (e) {
          setProfile(null);
        } finally {
          setLoading(false);
        }
      };
      loadProfile();
    }, [])
  );

  // 신뢰 점수 색상: 36.5 기준 이상이면 초록, 미만이면 주황
  const getScoreColor = (score) =>
    score >= 36.5 ? colors.success : colors.warning;

  // 신뢰 점수를 온도계 비율로 표현 (0 ~ 50점 범위 기준)
  const getScoreBarWidth = (score) =>
    `${Math.min((score / 50) * 100, 100)}%`;

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>내 정보</Text>
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // 프로필 로드 실패 또는 비로그인 상태 - 회원가입 유도 화면
  if (!profile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>내 정보</Text>
        </View>
        <View style={styles.center}>
          <Text style={styles.icon}>👤</Text>
          <Text style={styles.guestTitle}>로그인이 필요합니다</Text>
          <Text style={styles.guestSubtitle}>
            로그인하면 매물 등록, 채팅, 신뢰 점수 관리 등을{'\n'}이용할 수 있습니다.
          </Text>
          <View style={styles.buttonGroup}>
            <Button
              title="회원가입"
              onPress={() => navigation.navigate('SignUp')}
              style={styles.button}
            />
            <Button
              title="로그인"
              variant="secondary"
              onPress={() => {/* TODO: 로그인 화면 */}}
              style={styles.button}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>내 정보</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* 프로필 카드 */}
        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarEmoji}>👤</Text>
          </View>
          <Text style={styles.nickname}>{profile.nickname}</Text>
          <Text style={styles.username}>@{profile.username}</Text>
          {profile.phoneVerified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓ 휴대폰 인증 완료</Text>
            </View>
          )}
        </View>

        {/* 신뢰 점수(매너온도) 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>신뢰 점수 (매너온도)</Text>

          <View style={styles.scoreCard}>
            {/* 점수 숫자 - 거래 완료 시 즉시 갱신되는 핵심 지표 */}
            <View style={styles.scoreRow}>
              <Text
                style={[styles.scoreNumber, { color: getScoreColor(profile.reliabilityScore) }]}
              >
                {profile.reliabilityScore?.toFixed(1)}
              </Text>
              <Text style={styles.scoreDegree}>점</Text>
            </View>

            {/* 시각적 게이지 바 */}
            <View style={styles.scoreBarTrack}>
              <View
                style={[
                  styles.scoreBarFill,
                  {
                    width: getScoreBarWidth(profile.reliabilityScore),
                    backgroundColor: getScoreColor(profile.reliabilityScore),
                  },
                ]}
              />
            </View>
            <View style={styles.scoreRangeRow}>
              <Text style={styles.scoreRangeText}>0점</Text>
              <Text style={styles.scoreBaselineText}>기준 36.5점</Text>
              <Text style={styles.scoreRangeText}>50점</Text>
            </View>

            <Text style={styles.scoreHint}>
              거래 완료 시 +0.5점 상승합니다
            </Text>
          </View>
        </View>

        {/* 거래 통계 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>거래 현황</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{profile.tradeCount}</Text>
              <Text style={styles.statLabel}>완료 거래</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {profile.reliabilityScore >= 36.5 ? '🔥' : '❄️'}
              </Text>
              <Text style={styles.statLabel}>
                {profile.reliabilityScore >= 36.5 ? '활발한 거래자' : '거래 시작 중'}
              </Text>
            </View>
          </View>
        </View>

        {/* 계정 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>계정 정보</Text>
          <View style={styles.infoList}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>이메일</Text>
              <Text style={styles.infoValue}>{profile.email}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>가입 방식</Text>
              <Text style={styles.infoValue}>{profile.provider}</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.screenTitle,
    color: colors.textPrimary,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  // 비로그인 상태 스타일
  icon: {
    fontSize: 56,
    marginBottom: spacing.sm,
  },
  guestTitle: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  guestSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonGroup: {
    width: '100%',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  button: {
    width: '100%',
  },
  // 프로필 카드
  profileCard: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 8,
    borderBottomColor: colors.background,
    gap: spacing.xs,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarEmoji: {
    fontSize: 40,
  },
  nickname: {
    ...typography.screenTitle,
    color: colors.textPrimary,
  },
  username: {
    ...typography.body,
    color: colors.textSecondary,
  },
  verifiedBadge: {
    backgroundColor: colors.accent + '1A',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginTop: spacing.xs,
  },
  verifiedText: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '600',
  },
  // 섹션 공통
  section: {
    backgroundColor: colors.surface,
    marginTop: 8,
    padding: spacing.md,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  // 신뢰 점수 카드
  scoreCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: '800',
    lineHeight: 56,
  },
  scoreDegree: {
    ...typography.sectionTitle,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  scoreBarTrack: {
    height: 10,
    backgroundColor: colors.border,
    borderRadius: 5,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  scoreRangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreRangeText: {
    ...typography.caption,
    color: colors.textDisabled,
  },
  scoreBaselineText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  scoreHint: {
    ...typography.caption,
    color: colors.textDisabled,
    textAlign: 'center',
  },
  // 거래 통계
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.xs,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  // 계정 정보 리스트
  infoList: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  infoLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  infoValue: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  infoDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
});

export default MyPageScreen;
