import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../constants/theme';

// 채팅 화면 - 다음 단계에서 구현 예정
// WebSocket 또는 SSE 기반 실시간 메시징 도입 후 본격 구현
const ChatScreen = () => {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>채팅</Text>
      </View>
      <View style={styles.center}>
        <Text style={styles.placeholder}>💬</Text>
        <Text style={styles.placeholderText}>채팅 기능 준비 중입니다.</Text>
        <Text style={styles.placeholderSub}>거래 상대방과의 채팅이 여기에 표시됩니다.</Text>
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
    gap: spacing.sm,
  },
  placeholder: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  placeholderText: {
    ...typography.sectionTitle,
    color: colors.textSecondary,
  },
  placeholderSub: {
    ...typography.body,
    color: colors.textDisabled,
  },
});

export default ChatScreen;
