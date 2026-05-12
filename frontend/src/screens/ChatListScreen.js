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
import { tokenStorage } from '../utils/tokenStorage';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

const ChatListScreen = ({ navigation }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  const loadRooms = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const uid = await tokenStorage.getUserId();
      setCurrentUserId(uid);
      const data = await fetchMyChatRooms();
      setRooms(data);
    } catch (e) {
      console.error('[ChatList] 채팅방 목록 로드 실패:', e.message);
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRooms();
    }, [loadRooms])
  );

  const handleRoomPress = useCallback((room) => {
    navigation.navigate('ChatRoom', {
      roomId: room.roomId,
      itemId: room.itemId,
      itemTitle: `매물 #${room.itemId}`,
      currentUserId,
      sellerId: room.receiverId,
    });
  }, [navigation, currentUserId]);

  const renderRoom = useCallback(({ item }) => {
    const otherUserId = item.senderId === currentUserId ? item.receiverId : item.senderId;
    const isSeller = item.receiverId === currentUserId;

    return (
      <TouchableOpacity
        style={styles.roomItem}
        onPress={() => handleRoomPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>👤</Text>
        </View>

        <View style={styles.roomInfo}>
          <View style={styles.roomHeader}>
            <Text style={styles.userName}>사용자 #{otherUserId}</Text>
            <Text style={styles.itemBadge}>매물 #{item.itemId}</Text>
          </View>
          <Text style={styles.previewText} numberOfLines={1}>
            {isSeller ? '📦 판매자로 참여 중' : '🛒 구매자로 참여 중'}
          </Text>
        </View>

        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    );
  }, [handleRoomPress, currentUserId]);

  const renderContent = () => {
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
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadRooms()}>
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
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
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>채팅</Text>
      </View>
      {renderContent()}
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
  errorIcon: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    ...typography.button,
    color: colors.textInverse,
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
    backgroundColor: colors.primary + '1A',
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
    marginLeft: spacing.md + 48 + spacing.md,
  },
});

export default ChatListScreen;
