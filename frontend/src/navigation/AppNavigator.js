import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';
import LoungeScreen from '../screens/LoungeScreen';
import PostDetailScreen from '../screens/PostDetailScreen';
import WritePostScreen from '../screens/WritePostScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ChatRoomScreen from '../screens/ChatRoomScreen';
import MyPageScreen from '../screens/MyPageScreen';
import SignUpScreen from '../screens/SignUpScreen';
import LoginScreen from '../screens/LoginScreen';
import { colors, typography } from '../constants/theme';

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const LoungeStack = createNativeStackNavigator();
const ChatStack = createNativeStackNavigator();
const MyPageStack = createNativeStackNavigator();

// 홈 탭: 매물 목록 → 상세 흐름
const HomeStackNavigator = () => (
  <HomeStack.Navigator>
    <HomeStack.Screen
      name="Home"
      component={HomeScreen}
      options={{ headerShown: false }}
    />
    <HomeStack.Screen
      name="ItemDetail"
      component={ItemDetailScreen}
      options={{ title: '매물 상세', headerBackTitle: '목록' }}
    />
  </HomeStack.Navigator>
);

// 라운지 탭: 게시글 목록 → 상세 → 작성 스택
// WritePost는 Modal presentation으로 자연스러운 글쓰기 진입 UX 제공
const LoungeStackNavigator = () => (
  <LoungeStack.Navigator>
    <LoungeStack.Screen
      name="Lounge"
      component={LoungeScreen}
      options={{ headerShown: false }}
    />
    <LoungeStack.Screen
      name="PostDetail"
      component={PostDetailScreen}
      options={{
        title: '게시글',
        headerBackTitle: '목록',
        headerTintColor: colors.textPrimary,
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { ...typography.sectionTitle, color: colors.textPrimary },
      }}
    />
    <LoungeStack.Screen
      name="WritePost"
      component={WritePostScreen}
      options={{
        title: '글쓰기',
        headerBackTitle: '취소',
        headerTintColor: colors.textPrimary,
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { ...typography.sectionTitle, color: colors.textPrimary },
        presentation: 'modal',
      }}
    />
  </LoungeStack.Navigator>
);

// 채팅 탭: 채팅방 목록
const ChatStackNavigator = () => (
  <ChatStack.Navigator>
    <ChatStack.Screen
      name="ChatList"
      component={ChatListScreen}
      options={{ headerShown: false }}
    />
  </ChatStack.Navigator>
);

// 내 정보 탭: 회원가입 등 인증 관련 화면 포함
const MyPageStackNavigator = () => (
  <MyPageStack.Navigator>
    <MyPageStack.Screen
      name="MyPage"
      component={MyPageScreen}
      options={{ headerShown: false }}
    />
    <MyPageStack.Screen
      name="SignUp"
      component={SignUpScreen}
      options={{ title: '회원가입', headerBackTitle: '뒤로' }}
    />
    <MyPageStack.Screen
      name="Login"
      component={LoginScreen}
      options={{ title: '로그인', headerBackTitle: '뒤로' }}
    />
  </MyPageStack.Navigator>
);

// 하단 탭 네비게이터 - 4탭 구성
// 마켓 | 라운지 | 채팅 | 내 정보
// 라운지 추가로 거래 외 콘텐츠 소비 경로 확보 → 앱 체류 시간 및 재방문율 향상 목적
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textDisabled,
      tabBarStyle: {
        borderTopColor: colors.border,
        backgroundColor: colors.surface,
      },
      tabBarLabelStyle: {
        ...typography.caption,
      },
      tabBarIcon: ({ focused, color, size }) => {
        const iconMap = {
          HomeTab:   focused ? 'storefront'          : 'storefront-outline',
          LoungeTab: focused ? 'chatbubbles'         : 'chatbubbles-outline',
          ChatTab:   focused ? 'chatbubble-ellipses'  : 'chatbubble-ellipses-outline',
          MyPageTab: focused ? 'person'               : 'person-outline',
        };
        return <Ionicons name={iconMap[route.name]} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen name="HomeTab"   component={HomeStackNavigator}   options={{ title: '마켓' }} />
    <Tab.Screen name="LoungeTab" component={LoungeStackNavigator} options={{ title: '라운지' }} />
    <Tab.Screen name="ChatTab"   component={ChatStackNavigator}   options={{ title: '채팅' }} />
    <Tab.Screen name="MyPageTab" component={MyPageStackNavigator} options={{ title: '내 정보' }} />
  </Tab.Navigator>
);

// Root Stack: 탭 네비게이터를 감싸는 최상위 스택
// ChatRoom을 여기에 등록하여 홈/라운지/채팅 탭 어디서든 채팅방 진입 가능
const AppNavigator = () => (
  <NavigationContainer>
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Main" component={MainTabs} />
      <RootStack.Screen
        name="ChatRoom"
        component={ChatRoomScreen}
        options={{
          headerShown: true,
          headerBackTitle: '뒤로',
          headerTintColor: colors.textPrimary,
          headerStyle: { backgroundColor: colors.surface },
          headerTitleStyle: { ...typography.sectionTitle, color: colors.textPrimary },
          presentation: 'card',
        }}
      />
    </RootStack.Navigator>
  </NavigationContainer>
);

export default AppNavigator;
