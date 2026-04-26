import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/common/Button';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

// 내 정보 화면 - 로그인 전후 상태에 따라 다른 UI를 보여주는 화면
// JWT 도입 후: 토큰 존재 시 프로필 표시, 없으면 로그인/회원가입 버튼 표시
const MyPageScreen = ({ navigation }) => {
  // TODO: JWT 도입 후 인증 상태 전역 관리 (Zustand 등)를 통해 조건 분기
  const isLoggedIn = false;

  if (isLoggedIn) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>내 정보</Text>
        </View>
        {/* TODO: 프로필 정보, 나의 매물, 신뢰 점수 등 표시 */}
      </SafeAreaView>
    );
  }

  // 비로그인 상태 - 회원가입 유도 화면
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>내 정보</Text>
      </View>
      <View style={styles.center}>
        <Text style={styles.icon}>👤</Text>
        <Text style={styles.title}>로그인이 필요합니다</Text>
        <Text style={styles.subtitle}>
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
            onPress={() => {/* TODO: 로그인 화면으로 이동 */}}
            style={styles.button}
          />
        </View>
      </View>
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
  icon: {
    fontSize: 56,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
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
});

export default MyPageScreen;
