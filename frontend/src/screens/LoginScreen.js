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
import { login } from '../api/userApi';
import { colors, spacing, typography } from '../constants/theme';

const LoginScreen = ({ navigation }) => {
  const [form, setForm] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.username.trim()) newErrors.username = '아이디를 입력해주세요.';
    if (!form.password) newErrors.password = '비밀번호를 입력해주세요.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(form.username, form.password);
      navigation.goBack();
    } catch (e) {
      Alert.alert('로그인 실패', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>로그인</Text>
          <Text style={styles.subtitle}>마켓앱에 오신 것을 환영합니다</Text>

          <Input
            label="아이디"
            value={form.username}
            onChangeText={(v) => updateField('username', v)}
            placeholder="아이디 입력"
            autoCapitalize="none"
            errorMessage={errors.username}
          />
          <Input
            label="비밀번호"
            value={form.password}
            onChangeText={(v) => updateField('password', v)}
            placeholder="비밀번호 입력"
            secureTextEntry
            errorMessage={errors.password}
          />

          <Button
            title="로그인"
            onPress={handleLogin}
            loading={loading}
            style={styles.loginButton}
          />
          <Button
            title="계정이 없으신가요? 회원가입"
            variant="secondary"
            onPress={() => navigation.replace('SignUp')}
            style={styles.signupButton}
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
  loginButton: {
    marginTop: spacing.md,
  },
  signupButton: {
    marginTop: spacing.sm,
  },
});

export default LoginScreen;
