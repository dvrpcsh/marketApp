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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Client } from '@stomp/stompjs';
import { fetchChatMessages } from '../api/chatApi';
import { completeTrade } from '../api/itemApi';
import { tokenStorage } from '../utils/tokenStorage';
import { WS_BASE_URL } from '../constants/config';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

// 1:1 실시간 채팅방 화면
//
// 데이터 흐름 (STOMP):
// 전송: 입력창 → handleSend() → /app/chat.send → 서버 DB 저장 → /topic/room/{id} 브로드캐스트 → 구독 콜백 → UI 업데이트
// 수신: 서버 브로드캐스트 → /topic/room/{id} 구독 콜백 → setMessages() → UI 업데이트
// 시스템 메시지: 거래 완료 API 호출 → 서버가 /topic/room/{id} 로 SYSTEM 타입 메시지 푸시 → 중앙 배너 렌더링
//
// 거래 완료 버튼은 판매자(currentUserId === sellerId)에게만 표시
// FlatList inverted: 최신 메시지를 항상 화면 하단에 고정
const ChatRoomScreen = ({ route, navigation }) => {
  const { roomId, itemId, itemTitle, sellerId } = route.params;

  const [messages, setMessages] = useState([]);
  // tokenStorage에서 실제 로그인 사용자 ID를 로드 - route.params 하드코딩 값 대신 사용
  const [currentUserId, setCurrentUserId] = useState(null);
  const isSeller = currentUserId !== null && currentUserId === sellerId;
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [tradeCompleted, setTradeCompleted] = useState(false);
  const [completeLoading, setCompleteLoading] = useState(false);
  const stompClientRef = useRef(null);

  // 채팅방 입장 시 이전 대화 내역 REST API로 로드
  const loadHistory = useCallback(async () => {
    try {
      const history = await fetchChatMessages(roomId);
      // 서버는 오래된 순(ASC)으로 반환, inverted FlatList는 최신이 앞에 와야 하므로 reverse
      setMessages([...history].reverse());

      // 히스토리에 시스템 메시지가 있으면 거래 완료 상태로 표시
      const hasCompleted = history.some(m => m.type === 'SYSTEM');
      if (hasCompleted) setTradeCompleted(true);
    } catch (e) {
      console.error('채팅 히스토리 로드 실패:', e.message);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  // STOMP WebSocket 연결 및 채팅방 구독
  const connectStomp = useCallback(async () => {
    const accessToken = await tokenStorage.getAccessToken();
    console.log('[STOMP] 연결 시작 — 토큰 존재:', !!accessToken, '/ WS URL:', `${WS_BASE_URL}/ws`);

    // Raw WebSocket 연결 테스트 — STOMP 없이 TCP 연결 자체가 되는지 확인
    const testWs = new WebSocket(`${WS_BASE_URL}/ws`);
    testWs.onopen  = () => { console.log('[WS Raw] 연결 성공'); testWs.close(); };
    testWs.onerror = (e) => console.error('[WS Raw] 에러:', JSON.stringify(e));
    testWs.onclose = (e) => console.log('[WS Raw] 닫힘 — code:', e.code, '/ reason:', e.reason);

    const client = new Client({
      // React Native 전역 WebSocket API 사용 - SockJS 없이 순수 WebSocket 연결
      webSocketFactory: () => new WebSocket(`${WS_BASE_URL}/ws`),
      // StompAuthChannelInterceptor가 CONNECT 프레임의 이 헤더로 JWT 검증
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      reconnectDelay: 5000,
      // STOMP 라이브러리 내부 흐름 추적
      debug: (str) => console.log('[STOMP Debug]', str),
      onConnect: () => {
        console.log('[STOMP] 연결 성공');
        setConnected(true);
        // 이 채팅방 전용 구독 채널 - 일반 메시지와 시스템 메시지 모두 여기로 수신
        client.subscribe(`/topic/room/${roomId}`, (stompMessage) => {
          const received = JSON.parse(stompMessage.body);
          // inverted FlatList: 앞에 추가해야 화면 하단(최신 메시지 위치)에 표시됨
          setMessages(prev => [received, ...prev]);

          // 시스템 메시지(거래 완료 알림) 수신 시 거래 완료 상태로 전환
          if (received.type === 'SYSTEM') {
            setTradeCompleted(true);
          }
        });
      },
      onDisconnect: () => {
        console.log('[STOMP] 연결 해제');
        setConnected(false);
      },
      onStompError: (frame) => {
        console.error('[STOMP] STOMP 에러:', frame.headers['message']);
        setConnected(false);
      },
      onWebSocketError: (error) => {
        console.error('[STOMP] WebSocket 에러:', error?.message ?? error);
        setConnected(false);
      },
    });

    // 재연결 시마다(reconnectDelay) 최신 토큰으로 갱신
    // 최초 연결 이후 토큰이 갱신되어도 STOMP가 올바른 토큰을 사용하도록 보장
    client.beforeConnect = async () => {
      const freshToken = await tokenStorage.getAccessToken();
      client.connectHeaders = { Authorization: `Bearer ${freshToken}` };
      console.log('[STOMP] beforeConnect — 토큰 갱신');
    };

    client.activate();
    stompClientRef.current = client;
  }, [roomId]);

  // 헤더 우측에 "거래 완료하기" 버튼 설정 (판매자 전용)
  // navigation.setOptions로 네비게이션 헤더에 직접 버튼을 배치하여 화면 공간 효율 극대화
  useEffect(() => {
    navigation.setOptions({
      title: itemTitle || '채팅',
      headerRight: isSeller && !tradeCompleted
        ? () => (
            <TouchableOpacity
              onPress={handleCompleteTrade}
              disabled={completeLoading}
              style={styles.headerButton}
              activeOpacity={0.7}
            >
              {completeLoading
                ? <ActivityIndicator size="small" color={colors.primary} />
                : <Text style={styles.headerButtonText}>거래 완료</Text>
              }
            </TouchableOpacity>
          )
        : tradeCompleted
          ? () => <Text style={styles.headerBadge}>거래완료</Text>
          : undefined,
    });
  }, [isSeller, tradeCompleted, completeLoading]);

  useEffect(() => {
    tokenStorage.getUserId().then(uid => {
      if (uid) setCurrentUserId(uid);
    });
    loadHistory();
    connectStomp();
    return () => {
      stompClientRef.current?.deactivate();
    };
  }, []);

  // 거래 완료 처리 핸들러
  //
  // 흐름:
  // 1. API 호출 → 서버에서 아이템 상태 변경 + 거래 이력 저장 + 신뢰 점수 +0.5
  // 2. 서버가 채팅방에 SYSTEM 메시지 브로드캐스트 → 양쪽이 동시에 완료 알림 수신
  // 3. 응답의 updatedSellerScore로 즉시 갱신된 점수를 Alert에 표시
  const handleCompleteTrade = useCallback(async () => {
    Alert.alert(
      '거래 완료',
      '거래를 완료하시겠습니까?\n완료 후에는 취소할 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '완료하기',
          style: 'default',
          onPress: async () => {
            setCompleteLoading(true);
            try {
              // sellerId = currentUserId (판매자 본인), buyerId = 상대방
              const otherUserId = sellerId === currentUserId
                ? route.params.otherUserId   // 명시적으로 전달된 경우
                : sellerId;                   // 판매자가 아닌 경우의 폴백
              const buyerId = messages.find(m => m.senderId !== sellerId && m.senderId !== 0)?.senderId
                ?? route.params.otherUserId;

              const result = await completeTrade(itemId, currentUserId, buyerId, roomId);

              Alert.alert(
                '🎉 거래 완료!',
                `신뢰 점수가 ${result.updatedSellerScore?.toFixed(1)}점으로 올랐습니다!\n거래 횟수: ${result.updatedSellerTradeCount}회`
              );
              setTradeCompleted(true);
            } catch (e) {
              Alert.alert('오류', e.message || '거래 완료 처리에 실패했습니다.');
            } finally {
              setCompleteLoading(false);
            }
          },
        },
      ]
    );
  }, [itemId, currentUserId, sellerId, roomId, messages]);

  // 메시지 전송: STOMP publish → 서버 처리 → 구독 콜백으로 수신
  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text || !stompClientRef.current?.connected) return;

    // senderId는 서버가 JWT Principal에서 추출 - 클라이언트에서 보내지 않음
    stompClientRef.current.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({ roomId, message: text }),
    });
    setInputText('');
  }, [inputText, roomId, currentUserId]);

  // 메시지 렌더링: NORMAL(말풍선) vs SYSTEM(중앙 배너) 분기
  const renderMessage = useCallback(({ item: msg }) => {
    // 시스템 메시지: 거래 완료 알림 등 - 중앙 배너 스타일
    if (msg.type === 'SYSTEM') {
      return (
        <View style={styles.systemMessageContainer}>
          <View style={styles.systemMessageBubble}>
            <Text style={styles.systemMessageText}>{msg.message}</Text>
          </View>
        </View>
      );
    }

    // 일반 메시지: 내 메시지(오른쪽 주황) vs 상대방 메시지(왼쪽 회색)
    const isMyMessage = msg.senderId === currentUserId;
    const timeString = msg.createdAt
      ? new Date(msg.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
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
              {msg.message}
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
      {/* 연결 상태 배너 */}
      {!connected && (
        <View style={styles.connectingBanner}>
          <Text style={styles.connectingText}>연결 중...</Text>
        </View>
      )}

      {/* 거래 완료 상태 배너 - 구매자에게도 표시 */}
      {tradeCompleted && (
        <View style={styles.completedBanner}>
          <Text style={styles.completedBannerText}>✅ 거래가 완료된 채팅방입니다</Text>
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
          keyExtractor={(item) => item.messageId?.toString() ?? String(item.createdAt) + Math.random()}
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

        {/* 거래 완료 후 입력창 비활성화 */}
        {!tradeCompleted ? (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="메시지를 입력하세요..."
              placeholderTextColor={colors.textDisabled}
              multiline
              maxLength={500}
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
        ) : (
          <View style={styles.completedInputArea}>
            <Text style={styles.completedInputText}>거래가 완료되어 메시지를 보낼 수 없습니다.</Text>
          </View>
        )}
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
  completedBanner: {
    backgroundColor: colors.success + '1A',
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.success + '33',
  },
  completedBannerText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
  },
  headerButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1.5,
    borderColor: colors.primary,
    marginRight: spacing.xs,
  },
  headerButtonText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  headerBadge: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '700',
    marginRight: spacing.sm,
  },
  messageList: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  emptyContainer: {
    // inverted FlatList: transform으로 다시 뒤집어 텍스트 정상 렌더링
    transform: [{ scaleY: -1 }],
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textDisabled,
  },
  // 시스템 메시지 (거래 완료 알림 등) - 중앙 배너 스타일
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  systemMessageBubble: {
    backgroundColor: colors.secondary + '0D', // 네이비 5% 투명도
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.secondary + '1A',
  },
  systemMessageText: {
    ...typography.caption,
    color: colors.secondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  // 일반 메시지 말풍선
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
    marginBottom: 18,
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
  completedInputArea: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  completedInputText: {
    ...typography.caption,
    color: colors.textDisabled,
  },
});

export default ChatRoomScreen;
