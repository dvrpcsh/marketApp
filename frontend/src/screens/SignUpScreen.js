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

// 회원가입 화면 - 백엔드 SignUpRequestDto { username, password, nickname, email }에 1:1 대응하는 폼
// 각 필드의 유효성은 백엔드에서도 검증하지만, UX를 위해 프론트에서 기본 검사를 먼저 수행
const SignUpScreen = ({ navigation }) => {
  const [form, setForm] = useState({
    username: '',
    password: '',
    nickname: '',
    email: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // 입력 시작하면 해당 필드 에러 즉시 제거 - 수정 중임을 인식하도록
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  // 서버 전송 전 프론트 기본 유효성 검사
  // → 네트워크 요청을 줄이고 사용자에게 즉각적인 피드백 제공
  const validate = () => {
    const newErrors = {};
    if (form.username.length < 4) newErrors.username = '아이디는 4자 이상이어야 합니다.';
    if (form.password.length < 8) newErrors.password = '비밀번호는 8자 이상이어야 합니다.';
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
            placeholder="8자 이상"
            secureTextEntry
            errorMessage={errors.password}
          />
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
});

export default SignUpScreen;
