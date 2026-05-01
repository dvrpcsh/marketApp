import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { fetchMyChatRooms } from '../api/chatApi';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

// JWT 도입 후 토큰에서 자동으로 현재 사용자 ID를 추출할 예정
// 현재는 테스트용 임시 ID - 실제 사용자 ID로 변경하여 채팅방 목록 확인 가능
const TEMP_CURRENT_USER_ID = 1;

// 채팅 탭 - 내가 참여 중인 채팅방 목록 화면
// 각 항목 클릭 시 해당 채팅방(ChatRoomScreen)으로 이동
const ChatListScreen = ({ navigation }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRooms = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await fetchMyChatRooms(TEMP_CURRENT_USER_ID);
      setRooms(data);
    } catch (e) {
      console.error('채팅방 목록 로드 실패:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // 채팅방 탭 포커스될 때마다 목록 새로고침 - 새 채팅이 생겼을 때 바로 반영
  useFocusEffect(
    useCallback(() => {
      loadRooms();
    }, [loadRooms])
  );

  // 채팅방 클릭: Root Stack의 ChatRoom 화면으로 이동
  const handleRoomPress = useCallback((room) => {
    // ChatRoom 모델에서 receiverId = 판매자(매물 등록자)
    // senderId = 채팅을 먼저 시작한 구매자
    navigation.navigate('ChatRoom', {
      roomId: room.roomId,
      itemId: room.itemId,
      itemTitle: `매물 #${room.itemId}`, // 추후 Item API 조회로 실제 매물명 표시 예정
      currentUserId: TEMP_CURRENT_USER_ID,
      sellerId: room.receiverId,
    });
  }, [navigation]);

  const renderRoom = useCallback(({ item }) => {
    const otherUserId = item.senderId === TEMP_CURRENT_USER_ID ? item.receiverId : item.senderId;
    const isSeller = item.receiverId === TEMP_CURRENT_USER_ID;

    return (
      <TouchableOpacity
        style={styles.roomItem}
        onPress={() => handleRoomPress(item)}
        activeOpacity={0.7}
      >
        {/* 아바타 플레이스홀더 - 추후 프로필 이미지로 교체 */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>👤</Text>
        </View>

        <View style={styles.roomInfo}>
          <View style={styles.roomHeader}>
            <Text style={styles.userName}>사용자 #{otherUserId}</Text>
            <Text style={styles.itemBadge}>매물 #{item.itemId}</Text>
          </View>
          <Text style={styles.previewText} numberOfLines={1}>
            채팅방을 눌러 대화를 시작하세요
          </Text>
        </View>

        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    );
  }, [handleRoomPress]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>채팅</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => item.roomId.toString()}
          renderItem={renderRoom}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadRooms(true)}
              tintColor={colors.primary}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyText}>아직 진행 중인 채팅이 없어요</Text>
              <Text style={styles.emptySubText}>매물 상세에서 "채팅으로 거래하기"를 눌러보세요</Text>
            </View>
          }
        />
      )}
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.sectionTitle,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptySubText: {
    ...typography.body,
    color: colors.textDisabled,
    textAlign: 'center',
  },
  roomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
  },
  roomInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  userName: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
    fontSize: 16,
  },
  itemBadge: {
    ...typography.caption,
    color: colors.primary,
    backgroundColor: colors.primary + '1A', // 투명도 10%
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  previewText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  chevron: {
    fontSize: 20,
    color: colors.textDisabled,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.md + 48 + spacing.md, // 아바타 너비만큼 들여쓰기
  },
});

export default ChatListScreen;
