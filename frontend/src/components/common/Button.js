import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';

// 앱 전체에서 사용하는 범용 버튼 컴포넌트
// variant로 시각적 위계를 명확히 구분 - 한 화면에 Primary는 1개, Secondary는 보조 역할
const Button = ({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'secondary' | 'danger'
  loading = false,
  disabled = false,
  style,
}) => {
  const buttonStyle = [
    styles.base,
    styles[variant],
    (disabled || loading) && styles.disabled,
    style,
  ];

  const textStyle = [styles.baseText, styles[`${variant}Text`]];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {loading ? (
        // 로딩 중에도 버튼 크기를 유지하여 레이아웃 흔들림 방지
        <ActivityIndicator color={variant === 'secondary' ? colors.primary : colors.textInverse} />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  danger: {
    backgroundColor: colors.error,
  },
  disabled: {
    opacity: 0.4,
  },

  baseText: {
    ...typography.button,
  },
  primaryText: {
    color: colors.textInverse,
  },
  secondaryText: {
    color: colors.primary,
  },
  dangerText: {
    color: colors.textInverse,
  },
});

export default Button;
