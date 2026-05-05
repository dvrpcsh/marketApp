import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import {
  signUp,
  // TODO: 이메일 인증 재활성화 시 아래 두 줄 주석 해제
  // sendEmailCode,
  // verifyEmailCode,
  checkNicknameDuplicate,
  checkEmailDuplicate,
} from '../api/userApi';
import { colors, spacing, typography } from '../constants/theme';

const PASSWORD_RULES = [
  { id: 'length',  label: '8자 이상',     check: (pw) => pw.length >= 8 },
  { id: 'letter',  label: '영문 포함',     check: (pw) => /[a-zA-Z]/.test(pw) },
  { id: 'number',  label: '숫자 포함',     check: (pw) => /[0-9]/.test(pw) },
  { id: 'special', label: '특수문자 포함', check: (pw) => /[!@#$%^&*(),.?":{}|<>_\-]/.test(pw) },
];

const DEBOUNCE_MS = 600;

const SignUpScreen = ({ navigation }) => {
  const [form, setForm] = useState({ username: '', password: '', nickname: '', email: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // 비밀번호 체크리스트 — 입력 시작 또는 제출 시도 시 표시
  const [passwordTouched, setPasswordTouched] = useState(false);

  // 닉네임 중복 확인
  const [nicknameStatus, setNicknameStatus] = useState('idle');
  const nicknameTimer = useRef(null);

  // 이메일 중복 확인
  const [emailStatus, setEmailStatus] = useState('idle');
  const emailDupTimer = useRef(null);

  // 각 필드 포커스용 ref
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const nicknameRef = useRef(null);
  const emailRef   = useRef(null);

  // TODO: 이메일 인증 재활성화 시 아래 상태 주석 해제
  // const [emailFocused, setEmailFocused] = useState(false);
  // const [sendingCode, setSendingCode] = useState(false);
  // const [codeSent, setCodeSent] = useState(false);
  // const [inputCode, setInputCode] = useState('');
  // const [codeError, setCodeError] = useState('');
  // const [verifyingCode, setVerifyingCode] = useState(false);
  // const [emailVerified, setEmailVerified] = useState(false);

  // ── 중복 확인 디바운스 ────────────────────────────────────────────────────

  const triggerDuplicateCheck = (field, value) => {
    if (field === 'nickname') {
      clearTimeout(nicknameTimer.current);
      setNicknameStatus('idle');
      if (!value.trim()) return;
      nicknameTimer.current = setTimeout(async () => {
        setNicknameStatus('checking');
        try {
          await checkNicknameDuplicate(value);
          setNicknameStatus('available');
        } catch {
          setNicknameStatus('taken');
        }
      }, DEBOUNCE_MS);
    } else if (field === 'email') {
      clearTimeout(emailDupTimer.current);
      setEmailStatus('idle');
      if (!/\S+@\S+\.\S+/.test(value)) return;
      emailDupTimer.current = setTimeout(async () => {
        setEmailStatus('checking');
        try {
          await checkEmailDuplicate(value);
          setEmailStatus('available');
        } catch {
          setEmailStatus('taken');
        }
      }, DEBOUNCE_MS);
    }
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'password') setPasswordTouched(true);
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
    if (field === 'nickname' || field === 'email') triggerDuplicateCheck(field, value);
    // TODO: 이메일 인증 재활성화 시 아래 주석 해제
    // if (field === 'email') { setEmailVerified(false); setCodeSent(false); ... }
  };

  // ── 폼 유효성 검사 + 알림 + 포커스 ──────────────────────────────────────────

  const validate = () => {
    const failedPasswordRules = PASSWORD_RULES.filter(({ check }) => !check(form.password));

    const newErrors = {};
    if (form.username.length < 4)          newErrors.username = '아이디는 4자 이상이어야 합니다.';
    if (failedPasswordRules.length > 0)    newErrors.password = '비밀번호 조건을 모두 충족해주세요.';
    if (!form.nickname.trim())             newErrors.nickname = '닉네임을 입력해주세요.';
    if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email    = '올바른 이메일 형식이 아닙니다.';
    // TODO: 이메일 인증 재활성화 시 아래 주석 해제
    // else if (!emailVerified) newErrors.email = '이메일 인증이 필요합니다.';

    const nickDupFail  = nicknameStatus === 'taken' || nicknameStatus === 'checking';
    const emailDupFail = emailStatus   === 'taken' || emailStatus   === 'checking';

    setErrors(newErrors);

    // 하나라도 실패하면 알림 + 포커스
    const hasError = Object.keys(newErrors).length > 0 || nickDupFail || emailDupFail;
    if (hasError) {
      // 비밀번호 체크리스트 강제 표시
      setPasswordTouched(true);

      // 알림 메시지 조립
      const lines = [];
      if (newErrors.username) lines.push(`• 아이디: ${newErrors.username}`);
      if (newErrors.password) {
        const failed = failedPasswordRules.map((r) => r.label).join(', ');
        lines.push(`• 비밀번호: ${failed} 조건 미충족`);
      }
      if (nickDupFail) {
        lines.push(
          nicknameStatus === 'taken'
            ? '• 닉네임: 이미 사용 중인 닉네임입니다.'
            : '• 닉네임: 중복 확인 중입니다. 잠시 후 다시 시도해주세요.',
        );
      } else if (newErrors.nickname) {
        lines.push(`• 닉네임: ${newErrors.nickname}`);
      }
      if (emailDupFail) {
        lines.push(
          emailStatus === 'taken'
            ? '• 이메일: 이미 사용 중인 이메일입니다.'
            : '• 이메일: 중복 확인 중입니다. 잠시 후 다시 시도해주세요.',
        );
      } else if (newErrors.email) {
        lines.push(`• 이메일: ${newErrors.email}`);
      }

      Alert.alert('입력 정보를 확인해주세요', lines.join('\n'));

      // 첫 번째 오류 필드로 포커스 이동
      if (newErrors.username)                          usernameRef.current?.focus();
      else if (newErrors.password)                     passwordRef.current?.focus();
      else if (newErrors.nickname || nickDupFail)      nicknameRef.current?.focus();
      else if (newErrors.email    || emailDupFail)     emailRef.current?.focus();

      return false;
    }
    return true;
  };

  // ── 회원가입 제출 ─────────────────────────────────────────────────────────

  const handleSignUp = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await signUp(form);
      Alert.alert('가입 완료', '마켓앱에 오신 것을 환영합니다!', [
        { text: '확인', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('가입 실패', e.message);
    } finally {
      setLoading(false);
    }
  };

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

          {/* 아이디 */}
          <Input
            ref={usernameRef}
            label="아이디"
            value={form.username}
            onChangeText={(v) => updateField('username', v)}
            placeholder="영문, 숫자 4~50자"
            errorMessage={errors.username}
          />

          {/* 비밀번호 */}
          <Input
            ref={passwordRef}
            label="비밀번호"
            value={form.password}
            onChangeText={(v) => updateField('password', v)}
            placeholder="영문, 숫자, 특수문자 포함 8자 이상"
            secureTextEntry
            errorMessage={passwordTouched ? undefined : errors.password}
          />
          {/* 비밀번호 실시간 체크리스트 — 미충족 항목은 빨간색으로 표시 */}
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

          {/* 닉네임 */}
          <Input
            ref={nicknameRef}
            label="닉네임"
            value={form.nickname}
            onChangeText={(v) => updateField('nickname', v)}
            placeholder="다른 사용자에게 표시될 이름"
            errorMessage={nicknameStatus === 'idle' ? errors.nickname : undefined}
          />
          {nicknameStatus !== 'idle' && (
            <DupStatus
              status={nicknameStatus}
              availableMsg="사용 가능한 닉네임입니다."
              takenMsg="이미 사용 중인 닉네임입니다."
            />
          )}

          {/* 이메일 */}
          <Input
            ref={emailRef}
            label="이메일"
            value={form.email}
            onChangeText={(v) => updateField('email', v)}
            placeholder="example@email.com"
            keyboardType="email-address"
            errorMessage={emailStatus === 'idle' ? errors.email : undefined}
          />
          {emailStatus !== 'idle' && (
            <DupStatus
              status={emailStatus}
              availableMsg="사용 가능한 이메일입니다."
              takenMsg="이미 사용 중인 이메일입니다."
            />
          )}

          {/* TODO: 이메일 인증 재활성화 시 아래 블록 주석 해제
          {codeSent && !emailVerified && ( ... )}
          {emailVerified && ( ... )}
          */}

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

// ── 중복 확인 상태 표시 컴포넌트 ─────────────────────────────────────────────

const DupStatus = ({ status, availableMsg, takenMsg }) => (
  <View style={styles.dupRow}>
    {status === 'checking' ? (
      <ActivityIndicator size="small" color={colors.textSecondary} />
    ) : (
      <Text style={[styles.dupIcon, status === 'available' ? styles.dupAvailable : styles.dupTaken]}>
        {status === 'available' ? '✓' : '✗'}
      </Text>
    )}
    <Text style={[
      styles.dupText,
      status === 'checking' ? styles.dupChecking
        : status === 'available' ? styles.dupAvailable
        : styles.dupTaken,
    ]}>
      {status === 'checking' ? '확인 중...' : status === 'available' ? availableMsg : takenMsg}
    </Text>
  </View>
);

// ── 스타일 ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scrollContent: {
    padding: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: { ...typography.screenTitle, color: colors.textPrimary, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xl },
  submitButton: { marginTop: spacing.md },

  // 비밀번호 체크리스트
  passwordChecklist: {
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  checkIcon: { fontSize: 13, fontWeight: '700' },
  checkLabel: { ...typography.caption },
  checkPass: { color: colors.success },
  checkFail: { color: colors.error },   // 미충족 항목 → 빨간색

  // 중복 확인 상태
  dupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
    gap: spacing.xs,
  },
  dupIcon: { fontSize: 13, fontWeight: '700' },
  dupText: { ...typography.caption },
  dupChecking: { color: colors.textSecondary },
  dupAvailable: { color: colors.success },
  dupTaken: { color: colors.error },
});

export default SignUpScreen;
