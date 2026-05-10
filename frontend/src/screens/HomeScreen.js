import React, { useState, useEffect, useCallback } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import ItemCard from '../components/market/ItemCard';
import { fetchItems } from '../api/itemApi';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

// 앱의 메인 화면 - 판매중인 매물 목록을 최신순으로 표시
// 비회원도 접근 가능한 공개 화면이므로 인증 체크 없이 바로 데이터 로드
const HomeScreen = ({ navigation }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    loadItems();
  }, [loadItems]);

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
        // 각 아이템의 고유 id를 키로 사용 - React가 리스트 변경을 효율적으로 추적
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        // 당겨서 새로고침 - 실시간 매물 변동을 빠르게 반영
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
              onPress={() => navigation.navigate('WriteItem')}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.surface} />
              <Text style={styles.writeButtonText}>첫 매물 등록하기</Text>
            </TouchableOpacity>
          </View>
        }
      />
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
    paddingBottom: 80, // 하단 탭바에 가려지지 않도록 여유 공간 확보
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
});

export default HomeScreen;
