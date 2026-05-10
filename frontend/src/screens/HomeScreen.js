import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ItemCard from '../components/market/ItemCard';
import { fetchItems } from '../api/itemApi';
import { useAuth } from '../hooks/useAuth';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

// 앱의 메인 화면 - 판매중인 매물 목록을 최신순으로 표시
// 비회원도 탐색은 가능하되, 매물 등록 시점에만 로그인을 요구한다
const HomeScreen = ({ navigation }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const { requireAuth } = useAuth(navigation);

  // 매물 등록 진입 - 로그인 체크 후 WriteItem으로 이동
  const handleWriteItem = useCallback(() => {
    requireAuth(
      () => navigation.navigate('WriteItem'),
      '마켓 서비스를 이용하시려면 로그인이 필요합니다.',
    );
  }, [requireAuth, navigation]);

  // 매물 목록 로드 - 진입 시와 당겨서 새로고침 시 모두 이 함수 재사용
  const loadItems = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await fetchItems();
      setItems(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // 화면 포커스 시마다 목록 갱신 - 매물 등록·수정 후 뒤로 돌아왔을 때 자동 반영
  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems])
  );

  // renderItem을 useCallback으로 메모이제이션 - FlatList 스크롤 시 함수 재생성 방지
  const renderItem = useCallback(({ item }) => (
    <ItemCard
      item={item}
      onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
    />
  ), [navigation]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>마켓</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadItems(true)}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="storefront-outline" size={56} color={colors.textDisabled} />
            <Text style={styles.emptyText}>등록된 매물이 없습니다.</Text>
            <TouchableOpacity
              style={styles.writeButton}
              onPress={handleWriteItem}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.surface} />
              <Text style={styles.writeButtonText}>첫 매물 등록하기</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* FAB - 스크롤 위치와 무관하게 항상 접근 가능한 매물 등록 진입점 */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleWriteItem}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="판매 등록"
      >
        <Ionicons name="add" size={22} color={colors.surface} />
        <Text style={styles.fabText}>판매 등록</Text>
      </TouchableOpacity>
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
  list: {
    paddingTop: spacing.md,
    paddingBottom: 100, // FAB + 탭바 높이 확보
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  writeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  writeButtonText: {
    ...typography.button,
    color: colors.surface,
  },

  // FAB - pill 형태로 아이콘 + 텍스트를 함께 표시해 기능을 명확하게 전달
  // 목록 스크롤 중에도 항상 노출되어 매물 등록 진입 장벽을 최소화
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderRadius: 30,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.surface,
  },
});

export default HomeScreen;
