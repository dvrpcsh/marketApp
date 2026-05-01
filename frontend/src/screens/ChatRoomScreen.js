import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Client } from '@stomp/stompjs';
import { fetchChatMessages } from '../api/chatApi';
import { WS_BASE_URL } from '../constants/config';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

// 1:1 실시간 채팅방 화면
//
// 데이터 흐름 (STOMP):
// 전송: 입력창 → handleSend() → /app/chat.send 발송 → 서버 DB 저장 → /topic/room/{id} 브로드캐스트 → onMessage() 콜백 → UI 업데이트
// 수신: 서버 브로드캐스트 → /topic/room/{id} 구독 콜백 → setMessages() → UI 업데이트
//
// FlatList inverted: 최신 메시지를 항상 화면 하단에 고정
// → 데이터 배열은 [최신, ..., 오래된] 순서로 유지 (일반적인 시간순과 반대)
const ChatRoomScreen = ({ route, navigation }) => {
  const { roomId, itemTitle, currentUserId } = route.params;

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const stompClientRef = useRef(null);

  // 채팅방 입장 시 이전 대화 내역 REST API로 로드
  const loadHistory = useCallback(async () => {
    try {
      const history = await fetchChatMessages(roomId);
      // 서버는 오래된 순(ASC)으로 반환, inverted FlatList는 최신이 앞에 와야 하므로 reverse
      setMessages([...history].reverse());
    } catch (e) {
      console.error('채팅 히스토리 로드 실패:', e.message);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  // STOMP WebSocket 연결 및 채팅방 구독
  const connectStomp = useCallback(() => {
    const client = new Client({
      // React Native 전역 WebSocket API 사용 - SockJS 없이 순수 WebSocket 연결
      webSocketFactory: () => new WebSocket(`${WS_BASE_URL}/ws`),
      reconnectDelay: 5000, // 연결 끊김 시 5초 후 자동 재연결 시도
      onConnect: () => {
        setConnected(true);
        // 이 채팅방 전용 구독 채널에 연결 - 서버가 여기로 메시지를 브로드캐스트함
        client.subscribe(`/topic/room/${roomId}`, (stompMessage) => {
          const received = JSON.parse(stompMessage.body);
          // inverted FlatList: 앞에 추가해야 화면 하단(최신 메시지 위치)에 표시됨
          setMessages(prev => [received, ...prev]);
        });
      },
      onDisconnect: () => {
        setConnected(false);
      },
      onStompError: (frame) => {
        console.error('STOMP 에러:', frame.headers['message']);
        setConnected(false);
      },
      onWebSocketError: (event) => {
        console.error('WebSocket 연결 오류:', event);
        setConnected(false);
      },
    });

    client.activate();
    stompClientRef.current = client;
  }, [roomId]);

  useEffect(() => {
    // 헤더 제목을 매물명으로 동적 설정
    navigation.setOptions({ title: itemTitle || '채팅' });
    loadHistory();
    connectStomp();

    // 화면 이탈 시 WebSocket 연결 해제 - 서버 리소스 및 배터리 낭비 방지
    return () => {
      stompClientRef.current?.deactivate();
    };
  }, []);

  // 메시지 전송: STOMP publish → 서버 처리 → 구독 콜백으로 수신
  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text || !stompClientRef.current?.connected) return;

    stompClientRef.current.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({
        roomId,
        senderId: currentUserId,
        message: text,
      }),
    });

    setInputText('');
  }, [inputText, roomId, currentUserId]);

  // 메시지 버블 렌더링
  // 내 메시지: 오른쪽 정렬, 주황 배경 (primary)
  // 상대 메시지: 왼쪽 정렬, 회색 배경 (inputBackground)
  const renderMessage = useCallback(({ item }) => {
    const isMyMessage = item.senderId === currentUserId;
    const timeString = item.createdAt
      ? new Date(item.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      : '';

    return (
      <View style={[styles.messageRow, isMyMessage ? styles.myRow : styles.theirRow]}>
        {!isMyMessage && (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
        )}
        <View style={styles.bubbleWrapper}>
          <View style={[styles.bubble, isMyMessage ? styles.myBubble : styles.theirBubble]}>
            <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.theirMessageText]}>
              {item.message}
            </Text>
          </View>
          <Text style={[styles.timeText, isMyMessage ? styles.myTime : styles.theirTime]}>
            {timeString}
          </Text>
        </View>
      </View>
    );
  }, [currentUserId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>대화 내역 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* 연결 상태 표시 배너 */}
      {!connected && (
        <View style={styles.connectingBanner}>
          <Text style={styles.connectingText}>연결 중...</Text>
        </View>
      )}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* 메시지 목록 - inverted: 최신 메시지가 항상 하단에 고정 */}
        <FlatList
          data={messages}
          keyExtractor={(item) => item.messageId?.toString() ?? String(item.createdAt)}
          renderItem={renderMessage}
          inverted
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>첫 메시지를 보내보세요! 👋</Text>
            </View>
          }
        />

        {/* 메시지 입력 영역 */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="메시지를 입력하세요..."
            placeholderTextColor={colors.textDisabled}
            multiline
            maxLength={500}
            returnKeyType="default"
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim()}
            activeOpacity={0.7}
          >
            <Text style={styles.sendButtonText}>전송</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  connectingBanner: {
    backgroundColor: colors.warning,
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
  connectingText: {
    ...typography.caption,
    color: colors.surface,
    fontWeight: '600',
  },
  messageList: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  emptyContainer: {
    // inverted FlatList이므로 이 컴포넌트도 실제 화면에서는 뒤집혀 보임
    // → transform으로 다시 뒤집어 텍스트가 정상적으로 보이게 처리
    transform: [{ scaleY: -1 }],
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textDisabled,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: spacing.xs,
    alignItems: 'flex-end',
  },
  myRow: {
    justifyContent: 'flex-end',
  },
  theirRow: {
    justifyContent: 'flex-start',
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginBottom: 18, // 시간 텍스트 높이만큼 올려서 버블 하단 정렬
  },
  avatarText: {
    fontSize: 16,
  },
  bubbleWrapper: {
    maxWidth: '72%',
    gap: 2,
  },
  bubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  myBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: borderRadius.sm,
  },
  theirBubble: {
    backgroundColor: colors.inputBackground,
    borderBottomLeftRadius: borderRadius.sm,
  },
  messageText: {
    ...typography.body,
    lineHeight: 22,
  },
  myMessageText: {
    color: colors.textInverse,
  },
  theirMessageText: {
    color: colors.textPrimary,
  },
  timeText: {
    ...typography.caption,
    color: colors.textDisabled,
    fontSize: 11,
  },
  myTime: {
    textAlign: 'right',
  },
  theirTime: {
    textAlign: 'left',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.textPrimary,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignSelf: 'flex-end',
    minWidth: 56,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.border,
  },
  sendButtonText: {
    ...typography.button,
    color: colors.textInverse,
    fontSize: 14,
  },
});

export default ChatRoomScreen;
