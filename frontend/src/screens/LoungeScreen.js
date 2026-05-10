import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import PostCard from '../components/community/PostCard';
import { fetchPosts } from '../api/communityApi';
import { useAuth } from '../hooks/useAuth';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

const TABS = [
  { key: 'all',     label: '전체',    category: null,         sort: 'latest' },
  { key: 'price',   label: '시세',    category: 'PRICE_INFO', sort: 'latest' },
  { key: 'lfg',     label: 'LFG',     category: 'LFG',        sort: 'latest' },
  { key: 'free',    label: '자유',    category: 'FREE',       sort: 'latest' },
  { key: 'popular', label: '🔥 인기', category: null,         sort: 'popular' },
];

// 라운지 게시판 메인 화면
// - 탭 필터: 전체/시세/LFG/자유/🔥인기
// - FAB: 오른쪽 하단 글쓰기 버튼 (floating)
// - useFocusEffect: PostDetail에서 좋아요/댓글 후 돌아올 때 자동 갱신
const LoungeScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 글쓰기 버튼 클릭 시 로그인 여부 확인
  const { requireAuth } = useAuth(navigation);

  const currentTab = TABS.find(t => t.key === activeTab);

  const loadPosts = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      // Page 객체에서 content 배열만 추출 (Spring Data Page 구조)
      const data = await fetchPosts(currentTab.category, currentTab.sort);
      setPosts(data.content ?? data);
    } catch (e) {
      console.error('게시글 로드 실패:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentTab]);

  // 탭 포커스 시마다 + 탭 전환 시 게시글 재로드
  useFocusEffect(
    useCallback(() => {
      loadPosts();
    }, [loadPosts])
  );

  const handleTabChange = useCallback((tabKey) => {
    setActiveTab(tabKey);
    setLoading(true);
    setPosts([]);
  }, []);

  // FAB 클릭 → 로그인 체크 → 통과 시 글쓰기 화면으로 이동
  // 비로그인 유저도 목록 읽기는 자유롭게 허용하고, 작성 시점에만 로그인을 요구한다
  const handleWritePress = useCallback(() => {
    requireAuth(
      () => navigation.navigate('WritePost'),
      '라운지에서 소통하시려면 로그인이 필요합니다.',
    );
  }, [requireAuth, navigation]);

  const renderPost = useCallback(({ item }) => (
    <PostCard
      post={item}
      onPress={() => navigation.navigate('PostDetail', { postId: item.postId })}
    />
  ), [navigation]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>라운지</Text>
      </View>

      {/* 카테고리 탭 바 */}
      <View style={styles.tabBarWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBar}
        >
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => handleTabChange(tab.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => String(item.postId)}
          renderItem={renderPost}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadPosts(true)}
              tintColor={colors.primary}
            />
          }
          // 카드 사이 구분선
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyIcon}>✏️</Text>
              <Text style={styles.emptyText}>첫 번째 글을 작성해보세요!</Text>
            </View>
          }
        />
      )}

      {/* FAB - 로그인 체크 후 글쓰기 진입 */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleWritePress}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="글쓰기"
      >
        <Text style={styles.fabIcon}>✏️</Text>
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
  tabBarWrapper: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabBar: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: 'transparent',
  },
  tabActive: {
    backgroundColor: colors.primary + '15',
  },
  tabText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  list: {
    paddingBottom: 100, // FAB + 탭바 높이 확보
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  // FAB: Floating Action Button - 글쓰기 진입점
  // 항상 화면 위에 떠 있어 어디서든 즉시 글쓰기 진입 가능 → 콘텐츠 생산 장벽 최소화
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  fabIcon: {
    fontSize: 22,
  },
});

export default LoungeScreen;
