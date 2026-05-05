import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { signUp } from '../api/userApi';
import { colors, spacing, typography } from '../constants/theme';

const PASSWORD_RULES = [
  { id: 'length',  label: '8자 이상',     check: (pw) => pw.length >= 8 },
  { id: 'letter',  label: '영문 포함',     check: (pw) => /[a-zA-Z]/.test(pw) },
  { id: 'number',  label: '숫자 포함',     check: (pw) => /[0-9]/.test(pw) },
  { id: 'special', label: '특수문자 포함', check: (pw) => /[!@#$%^&*(),.?":{}|<>_\-]/.test(pw) },
];

const SignUpScreen = ({ navigation }) => {
  const [form, setForm] = useState({
    username: '',
    password: '',
    nickname: '',
    email: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'password') setPasswordTouched(true);
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const isPasswordValid = () => PASSWORD_RULES.every(({ check }) => check(form.password));

  const validate = () => {
    const newErrors = {};
    if (form.username.length < 4) newErrors.username = '아이디는 4자 이상이어야 합니다.';
    if (!isPasswordValid()) newErrors.password = '비밀번호 조건을 모두 충족해주세요.';
    if (!form.nickname.trim()) newErrors.nickname = '닉네임을 입력해주세요.';
    if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = '올바른 이메일 형식이 아닙니다.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      // 회원가입 성공 시 서버에서 생성된 사용자 프로필 반환
      await signUp(form);
      Alert.alert('가입 완료', '마켓앱에 오신 것을 환영합니다!', [
        { text: '확인', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      // 서버 에러 메시지를 Alert으로 표시 (예: "이미 사용 중인 아이디입니다.")
      Alert.alert('가입 실패', e.message);
    } finally {
      setLoading(false);
    }
  };

  // KeyboardAvoidingView: 키보드가 올라올 때 입력창이 가려지지 않도록 화면을 위로 밀어올림
  // iOS와 Android의 동작 방식이 달라 behavior 값을 플랫폼별로 분리
  const keyboardBehavior = Platform.OS === 'ios' ? 'padding' : 'height';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={keyboardBehavior}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>회원가입</Text>
          <Text style={styles.subtitle}>마켓앱 계정을 만들어 거래를 시작하세요</Text>

          <Input
            label="아이디"
            value={form.username}
            onChangeText={(v) => updateField('username', v)}
            placeholder="영문, 숫자 4~50자"
            errorMessage={errors.username}
          />
          <Input
            label="비밀번호"
            value={form.password}
            onChangeText={(v) => updateField('password', v)}
            placeholder="영문, 숫자, 특수문자 포함 8자 이상"
            secureTextEntry
            errorMessage={passwordTouched ? undefined : errors.password}
          />
          {passwordTouched && (
            <View style={styles.passwordChecklist}>
              {PASSWORD_RULES.map(({ id, label, check }) => {
                const passed = check(form.password);
                return (
                  <View key={id} style={styles.checkItem}>
                    <Text style={[styles.checkIcon, passed ? styles.checkPass : styles.checkFail]}>
                      {passed ? '✓' : '✗'}
                    </Text>
                    <Text style={[styles.checkLabel, passed ? styles.checkPass : styles.checkFail]}>
                      {label}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
          <Input
            label="닉네임"
            value={form.nickname}
            onChangeText={(v) => updateField('nickname', v)}
            placeholder="다른 사용자에게 표시될 이름"
            errorMessage={errors.nickname}
          />
          <Input
            label="이메일"
            value={form.email}
            onChangeText={(v) => updateField('email', v)}
            placeholder="example@email.com"
            keyboardType="email-address"
            errorMessage={errors.email}
          />

          <Button
            title="가입하기"
            onPress={handleSignUp}
            loading={loading}
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    padding: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    ...typography.screenTitle,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  submitButton: {
    marginTop: spacing.md,
  },
  passwordChecklist: {
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  checkIcon: {
    fontSize: 13,
    fontWeight: '700',
  },
  checkLabel: {
    ...typography.caption,
  },
  checkPass: {
    color: colors.success,
  },
  checkFail: {
    color: colors.textDisabled,
  },
});

export default SignUpScreen;
