import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../constants/theme';

// 상태 또는 인증 여부를 시각적으로 표현하는 배지 컴포넌트
// variant: 'accent' = 캐릭터 인증, 'success' = 거래 완료, 'warning' = 주의
const Badge = ({ label, variant = 'accent', style }) => {
  return (
    <View style={[styles.base, styles[variant], style]}>
      <Text style={[styles.text, styles[`${variant}Text`]]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  accent: {
    backgroundColor: `${colors.accent}22`, // 민트 20% 투명도 - 인증 배지
  },
  success: {
    backgroundColor: `${colors.success}22`,
  },
  warning: {
    backgroundColor: `${colors.warning}22`,
  },
  error: {
    backgroundColor: `${colors.error}22`,
  },

  text: {
    ...typography.caption,
    fontWeight: '600',
  },
  accentText: { color: colors.accent },
  successText: { color: colors.success },
  warningText: { color: colors.warning },
  errorText: { color: colors.error },
});

export default Badge;
