import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { createItem } from '../api/itemApi';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

// 추후 게임 추가 시 이 배열에만 항목을 추가하면 UI가 자동 확장됨
const GAMES = [
  { key: 'LOST_ARK', label: '로스트아크' },
];

// 로스트아크 서버 목록 - 한국 서버는 초성순(ㄴ→ㄹ→ㅅ→ㅇ→ㅋ) 정렬,
// 해외 서버(북미·유럽)와 기타는 관행상 맨 뒤에 위치
const SERVERS = [
  { key: 'NINAV',     label: '니나브' },
  { key: 'RUPEONE',  label: '루페온' },
  { key: 'SILIAN',   label: '실리안' },
  { key: 'AMAN',     label: '아만' },
  { key: 'ABRELSUD', label: '아브렐슈드' },
  { key: 'KADAN',    label: '카단' },
  { key: 'KAMAIN',   label: '카마인' },
  { key: 'KAJEROS',  label: '카제로스' },
  { key: 'NA',       label: '북미' },
  { key: 'EU',       label: '유럽' },
  { key: 'ETC',      label: '기타' },
];

const ITEM_TYPES = [
  { key: 'CURRENCY', label: '게임재화' },
  { key: 'ITEM',     label: '아이템' },
  { key: 'ETC',      label: '기타' },
];

// ── 서브 컴포넌트 ──────────────────────────────────────────

// 게임·물품종류 선택용 wrap 버튼 그룹
const SelectGroup = ({ options, selected, onSelect, locked }) => (
  <View style={styles.selectGroup}>
    {options.map(opt => {
      const isSelected = selected === opt.key;
      return (
        <TouchableOpacity
          key={opt.key}
          style={[styles.selectBtn, isSelected && styles.selectBtnActive]}
          // locked=true이면 이미 선택된 항목을 눌러도 해제되지 않음(게임 선택용)
          onPress={() => !locked && onSelect(isSelected ? null : opt.key)}
          activeOpacity={locked ? 1 : 0.7}
        >
          <Text style={[styles.selectBtnText, isSelected && styles.selectBtnTextActive]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

// 서버 선택용 가로 스크롤 탭
const ServerScrollTabs = ({ selected, onSelect }) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.serverTabsContent}
  >
    {SERVERS.map(s => {
      const isSelected = selected === s.key;
      return (
        <TouchableOpacity
          key={s.key}
          style={[styles.serverTab, isSelected && styles.serverTabActive]}
          onPress={() => onSelect(s.key)}
          activeOpacity={0.7}
        >
          <Text style={[styles.serverTabText, isSelected && styles.serverTabTextActive]}>
            {s.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </ScrollView>
);

// ── 메인 컴포넌트 ──────────────────────────────────────────

const WriteItemScreen = ({ navigation }) => {
  // 게임은 현재 로스트아크만 존재하므로 진입 시 바로 선택 상태로 초기화
  const [selectedGame, setSelectedGame]         = useState('LOST_ARK');
  const [selectedServer, setSelectedServer]     = useState(null);
  const [selectedItemType, setSelectedItemType] = useState(null);
  // quantityMan: 사용자가 입력하는 "만 골드" 단위 수량 (실제 골드 = quantityMan * 10,000)
  const [quantityMan, setQuantityMan]           = useState('');
  const [characterName, setCharacterName]       = useState('');
  const [title, setTitle]                       = useState('');
  const [description, setDescription]           = useState('');
  const [loading, setLoading]                   = useState(false);

  const quantityManNum = parseInt(quantityMan, 10) || 0;
  const isQuantityValid = quantityManNum >= 1;
  const isValid =
    selectedGame &&
    selectedServer &&
    selectedItemType &&
    isQuantityValid &&
    characterName.trim().length > 0 &&
    title.trim().length > 0;

  const handleQuantityChange = (text) => {
    setQuantityMan(text.replace(/[^0-9]/g, ''));
  };

  const handleSubmit = useCallback(async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      await createItem({
        gameName:      selectedGame,
        serverName:    selectedServer,
        category:      selectedItemType,
        quantity:      quantityManNum * 10000, // 서버는 골드 단위로 받음
        characterName: characterName.trim(),
        title:         title.trim(),
        description:   description.trim() || undefined,
      });
      Alert.alert('등록 완료', '매물이 등록되었습니다.', [
        { text: '확인', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('오류', e.message || '매물 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [isValid, selectedGame, selectedServer, selectedItemType, quantityManNum,
      characterName, title, description, navigation]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── 게임 선택 ── */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name="game-controller-outline" size={18} color={colors.primary} />
              <Text style={styles.sectionLabel}>게임 선택</Text>
            </View>
            <SelectGroup
              options={GAMES}
              selected={selectedGame}
              onSelect={setSelectedGame}
              locked  // 현재 로스트아크 단독 지원 — 선택 해제 불가
            />
          </View>

          {/* ── 서버 선택 ── */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name="server-outline" size={18} color={colors.primary} />
              <Text style={styles.sectionLabel}>서버 선택</Text>
            </View>
            <ServerScrollTabs
              selected={selectedServer}
              onSelect={setSelectedServer}
            />
          </View>

          {/* ── 물품 종류 ── */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name="cube-outline" size={18} color={colors.primary} />
              <Text style={styles.sectionLabel}>물품 종류</Text>
            </View>
            <SelectGroup
              options={ITEM_TYPES}
              selected={selectedItemType}
              onSelect={setSelectedItemType}
            />
          </View>

          {/* ── 판매 수량 ── */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name="cash-outline" size={18} color={colors.primary} />
              <Text style={styles.sectionLabel}>판매 수량</Text>
            </View>

            <View style={styles.quantityRow}>
              <TextInput
                style={[styles.input, styles.quantityInput]}
                value={quantityMan}
                onChangeText={handleQuantityChange}
                placeholder="0"
                placeholderTextColor={colors.textDisabled}
                keyboardType="numeric"
              />
              <Text style={styles.quantityUnitLabel}>만 골드</Text>
              {quantityManNum > 0 && (
                <Text style={styles.quantityConverted}>
                  = {(quantityManNum * 10000).toLocaleString()}골드
                </Text>
              )}
            </View>

            <View style={styles.hintRow}>
              <Ionicons name="information-circle-outline" size={14} color={colors.info} />
              <Text style={styles.hintText}>
                판매 수량은 <Text style={styles.hintBold}>1만 단위</Text>로만 등록 가능합니다.
              </Text>
            </View>
          </View>

          {/* ── 캐릭터명 ── */}
          <View style={styles.card}>
            <View style={styles.characterLabelRow}>
              <Ionicons name="person-circle" size={20} color={colors.primary} />
              <Text style={styles.characterLabel}>물품을 전달하실 캐릭터 명</Text>
              <View style={styles.requiredBadge}>
                <Text style={styles.requiredBadgeText}>필수</Text>
              </View>
            </View>

            <TextInput
              style={styles.input}
              value={characterName}
              onChangeText={setCharacterName}
              placeholder="캐릭터 명을 정확히 입력해주세요"
              placeholderTextColor={colors.textDisabled}
            />

            <View style={styles.warningBox}>
              <Ionicons name="warning" size={14} color={colors.error} style={styles.warningIcon} />
              <Text style={styles.warningText}>
                판매하는 본인 이외의 캐릭터 명 입력 시 사고가 발생할 수 있으며 그 책임은 본인에게 있으며 이 경우 보상이 어렵습니다.
              </Text>
            </View>
          </View>

          {/* ── 물품 제목 ── */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name="create-outline" size={18} color={colors.primary} />
              <Text style={styles.sectionLabel}>물품 제목</Text>
            </View>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="물품 제목을 입력해주세요 (최대 100자)"
              placeholderTextColor={colors.textDisabled}
              maxLength={100}
            />
            <Text style={styles.charCount}>{title.length}/100</Text>
          </View>

          {/* ── 상세 설명 ── */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text-outline" size={18} color={colors.primary} />
              <Text style={styles.sectionLabel}>상세 설명</Text>
            </View>
            <TextInput
              style={styles.textarea}
              value={description}
              onChangeText={setDescription}
              placeholder="물품에 대한 상세 설명을 입력해주세요."
              placeholderTextColor={colors.textDisabled}
              multiline
              textAlignVertical="top"
            />
          </View>

        </ScrollView>

        {/* ── 하단 버튼 ── */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>등록 취소</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitButton, (!isValid || loading) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!isValid || loading}
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>
              {loading ? '등록 중...' : '판매 등록'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },

  // 섹션 카드
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionLabel: {
    ...typography.sectionTitle,
    fontSize: 15,
    color: colors.textPrimary,
  },

  // 게임·물품종류 wrap 버튼
  selectGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  selectBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  selectBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  selectBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  selectBtnTextActive: {
    color: colors.surface,
    fontWeight: '600',
  },

  // 서버 가로 스크롤 탭
  serverTabsContent: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  serverTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  serverTabActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  serverTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  serverTabTextActive: {
    color: colors.surface,
    fontWeight: '600',
  },

  // 판매 수량
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  quantityInput: {
    flex: 1,
  },
  quantityUnitLabel: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  quantityConverted: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#EAF7FA',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
  },
  hintText: {
    ...typography.caption,
    color: colors.info,
    flex: 1,
  },
  hintBold: {
    fontWeight: '700',
  },

  // 캐릭터명
  characterLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  characterLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    flex: 1,
  },
  requiredBadge: {
    backgroundColor: colors.error,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  requiredBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.surface,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: '#FFF3F3',
    borderRadius: borderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  warningIcon: {
    marginTop: 1,
  },
  warningText: {
    ...typography.caption,
    color: colors.error,
    flex: 1,
    lineHeight: 18,
  },

  // 공통 인풋
  input: {
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textarea: {
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 160,
  },
  charCount: {
    ...typography.caption,
    color: colors.textDisabled,
    textAlign: 'right',
  },

  // 하단 버튼
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    ...typography.button,
    color: colors.textSecondary,
  },
  submitButton: {
    flex: 2,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.textDisabled,
  },
  submitButtonText: {
    ...typography.button,
    color: colors.surface,
  },
});

export default WriteItemScreen;
