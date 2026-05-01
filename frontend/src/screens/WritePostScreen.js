import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/common/Button';
import { createPost } from '../api/communityApi';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

const CATEGORIES = [
  { key: 'PRICE_INFO', label: '시세', color: colors.info },
  { key: 'LFG',        label: 'LFG',  color: colors.accent },
  { key: 'FREE',       label: '자유', color: colors.primary },
];

// JWT 도입 후 토큰에서 자동 추출 예정
const TEMP_AUTHOR_ID = 1;

// 게시글 작성 화면
const WritePostScreen = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const isValid = selectedCategory && title.trim().length > 0 && content.trim().length > 0;

  const handleSubmit = useCallback(async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      await createPost(TEMP_AUTHOR_ID, {
        title: title.trim(),
        content: content.trim(),
        category: selectedCategory,
      });
      // 작성 완료 후 라운지 목록으로 복귀 - useFocusEffect가 목록을 자동 갱신
      navigation.goBack();
    } catch (e) {
      Alert.alert('오류', e.message || '게시글 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [isValid, title, content, selectedCategory, navigation]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

          {/* 카테고리 선택 */}
          <View style={styles.section}>
            <Text style={styles.label}>카테고리</Text>
            <View style={styles.categoryRow}>
              {CATEGORIES.map(cat => {
                const isSelected = selectedCategory === cat.key;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    style={[
                      styles.categoryButton,
                      { borderColor: cat.color },
                      isSelected && { backgroundColor: cat.color },
                    ]}
                    onPress={() => setSelectedCategory(cat.key)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.categoryButtonText,
                      { color: isSelected ? colors.textInverse : cat.color },
                    ]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 제목 입력 */}
          <View style={styles.section}>
            <Text style={styles.label}>제목</Text>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="제목을 입력하세요 (최대 100자)"
              placeholderTextColor={colors.textDisabled}
              maxLength={100}
              returnKeyType="next"
            />
            <Text style={styles.charCount}>{title.length}/100</Text>
          </View>

          {/* 본문 입력 */}
          <View style={styles.section}>
            <Text style={styles.label}>내용</Text>
            <TextInput
              style={styles.contentInput}
              value={content}
              onChangeText={setContent}
              placeholder="내용을 입력하세요..."
              placeholderTextColor={colors.textDisabled}
              multiline
              textAlignVertical="top"
            />
          </View>

        </ScrollView>

        {/* 하단 게시 버튼 */}
        <View style={styles.footer}>
          <Button
            title="게시하기"
            onPress={handleSubmit}
            loading={loading}
            disabled={!isValid}
            style={styles.submitButton}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scrollContent: { padding: spacing.md, gap: spacing.lg },
  section: { gap: spacing.sm },
  label: { ...typography.sectionTitle, color: colors.textPrimary, fontSize: 15 },
  categoryRow: { flexDirection: 'row', gap: spacing.sm },
  categoryButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  categoryButtonText: { ...typography.button, fontSize: 14 },
  titleInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  charCount: {
    ...typography.caption,
    color: colors.textDisabled,
    textAlign: 'right',
  },
  contentInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 200,
  },
  footer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitButton: { width: '100%' },
});

export default WritePostScreen;
