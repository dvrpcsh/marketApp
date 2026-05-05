import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
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
  sendEmailCode,
  verifyEmailCode,
  checkNicknameDuplicate,
  checkEmailDuplicate,
} from '../api/userApi';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

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

  // 비밀번호 체크리스트
  const [passwordTouched, setPasswordTouched] = useState(false);

  // 닉네임 중복 확인
  const [nicknameStatus, setNicknameStatus] = useState('idle'); // idle|checking|available|taken
  const nicknameTimer = useRef(null);

  // 이메일 중복 확인
  const [emailStatus, setEmailStatus] = useState('idle');
  const emailDupTimer = useRef(null);

  // 이메일 인증
  const [emailFocused, setEmailFocused] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

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
    if (field === 'email') {
      setEmailVerified(false);
      setCodeSent(false);
      setInputCode('');
      setCodeError('');
    }
  };

  // ── 이메일 인증번호 발송 ───────────────────────────────────────────────────

  const handleSendCode = async () => {
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      setErrors((prev) => ({ ...prev, email: '올바른 이메일을 입력해주세요.' }));
      return;
    }
    if (emailStatus === 'taken') {
      setErrors((prev) => ({ ...prev, email: '이미 사용 중인 이메일입니다.' }));
      return;
    }
    setSendingCode(true);
    try {
      await sendEmailCode(form.email);
      setCodeSent(true);
      setInputCode('');
      setCodeError('');
    } catch (e) {
      Alert.alert('전송 실패', e.message);
    } finally {
      setSendingCode(false);
    }
  };

  // ── 인증번호 확인 ─────────────────────────────────────────────────────────

  const handleVerifyCode = async () => {
    if (inputCode.length < 6) {
      setCodeError('인증번호 6자리를 입력해주세요.');
      return;
    }
    setVerifyingCode(true);
    try {
      await verifyEmailCode(form.email, inputCode);
      setEmailVerified(true);
    } catch (e) {
      setCodeError(e.message);
    } finally {
      setVerifyingCode(false);
    }
  };

  // ── 폼 유효성 검사 ────────────────────────────────────────────────────────

  const isPasswordValid = () => PASSWORD_RULES.every(({ check }) => check(form.password));

  const validate = () => {
    const newErrors = {};
    if (form.username.length < 4) newErrors.username = '아이디는 4자 이상이어야 합니다.';
    if (!isPasswordValid()) newErrors.password = '비밀번호 조건을 모두 충족해주세요.';
    if (!form.nickname.trim()) newErrors.nickname = '닉네임을 입력해주세요.';
    if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = '올바른 이메일 형식이 아닙니다.';
    else if (!emailVerified) newErrors.email = '이메일 인증이 필요합니다.';
    setErrors(newErrors);
    const dupValid =
      nicknameStatus !== 'taken' && nicknameStatus !== 'checking' &&
      emailStatus !== 'taken' && emailStatus !== 'checking';
    return Object.keys(newErrors).length === 0 && dupValid;
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
  const isSendBtnDisabled = sendingCode || emailVerified || emailStatus === 'taken';

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
            label="아이디"
            value={form.username}
            onChangeText={(v) => updateField('username', v)}
            placeholder="영문, 숫자 4~50자"
            errorMessage={errors.username}
          />

          {/* 비밀번호 */}
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

          {/* 닉네임 */}
          <Input
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

          {/* 이메일 - 인증번호 보내기 버튼 포함 */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>이메일</Text>
            <View style={styles.emailRow}>
              <TextInput
                style={[
                  styles.emailTextInput,
                  emailFocused && styles.emailTextInputFocused,
                  errors.email && styles.emailTextInputError,
                ]}
                value={form.email}
                onChangeText={(v) => updateField('email', v)}
                placeholder="example@email.com"
                placeholderTextColor={colors.textDisabled}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!emailVerified}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
              <TouchableOpacity
                style={[styles.sendCodeBtn, isSendBtnDisabled && styles.sendCodeBtnDisabled]}
                onPress={handleSendCode}
                disabled={isSendBtnDisabled}
              >
                {sendingCode ? (
                  <ActivityIndicator size="small" color={colors.textInverse} />
                ) : (
                  <Text style={styles.sendCodeBtnText}>
                    {codeSent ? '재전송' : '인증번호\n보내기'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
            {errors.email && <Text style={styles.fieldError}>{errors.email}</Text>}
          </View>

          {/* 이메일 중복 확인 상태 */}
          {emailStatus !== 'idle' && !emailVerified && (
            <DupStatus
              status={emailStatus}
              availableMsg="사용 가능한 이메일입니다."
              takenMsg="이미 사용 중인 이메일입니다."
            />
          )}

          {/* 인증번호 입력 */}
          {codeSent && !emailVerified && (
            <View style={styles.codeSection}>
              <Text style={styles.codeHint}>인증번호를 5분 내에 입력해주세요.</Text>
              <View style={styles.codeRow}>
                <TextInput
                  style={[styles.codeTextInput, codeError ? styles.emailTextInputError : null]}
                  value={inputCode}
                  onChangeText={(v) => { setInputCode(v); setCodeError(''); }}
                  placeholder="인증번호 6자리"
                  placeholderTextColor={colors.textDisabled}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <TouchableOpacity
                  style={[styles.verifyBtn, verifyingCode && styles.sendCodeBtnDisabled]}
                  onPress={handleVerifyCode}
                  disabled={verifyingCode}
                >
                  {verifyingCode ? (
                    <ActivityIndicator size="small" color={colors.textInverse} />
                  ) : (
                    <Text style={styles.verifyBtnText}>확인</Text>
                  )}
                </TouchableOpacity>
              </View>
              {codeError ? <Text style={styles.fieldError}>{codeError}</Text> : null}
            </View>
          )}

          {/* 인증 완료 메시지 */}
          {emailVerified && (
            <View style={styles.verifiedRow}>
              <Text style={styles.verifiedText}>✓ 이메일 인증이 완료되었습니다.</Text>
            </View>
          )}

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
  checkFail: { color: colors.textDisabled },

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

  // 이메일 필드
  fieldContainer: { marginBottom: spacing.xs },
  fieldLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  emailRow: { flexDirection: 'row', gap: spacing.sm },
  emailTextInput: {
    flex: 1,
    height: 52,
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  emailTextInputFocused: { borderColor: colors.primary, backgroundColor: colors.surface },
  emailTextInputError: { borderColor: colors.error },
  sendCodeBtn: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  sendCodeBtnDisabled: { backgroundColor: colors.textDisabled },
  sendCodeBtnText: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 16,
  },
  fieldError: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },

  // 인증번호 입력
  codeSection: { marginBottom: spacing.md },
  codeHint: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm },
  codeRow: { flexDirection: 'row', gap: spacing.sm },
  codeTextInput: {
    flex: 1,
    height: 52,
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1.5,
    borderColor: 'transparent',
    letterSpacing: 4,
  },
  verifyBtn: {
    height: 52,
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  verifyBtnText: { ...typography.button, color: colors.textInverse },

  // 인증 완료
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  verifiedText: { ...typography.caption, color: colors.success, fontWeight: '700' },
});

export default SignUpScreen;
