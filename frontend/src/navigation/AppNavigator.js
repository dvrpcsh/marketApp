import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';
import WriteItemScreen from '../screens/WriteItemScreen';
import LoungeScreen from '../screens/LoungeScreen';
import PostDetailScreen from '../screens/PostDetailScreen';
import WritePostScreen from '../screens/WritePostScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ChatRoomScreen from '../screens/ChatRoomScreen';
import MyPageScreen from '../screens/MyPageScreen';
import SignUpScreen from '../screens/SignUpScreen';
import LoginScreen from '../screens/LoginScreen';
import { colors, typography } from '../constants/theme';
import { navigationRef } from '../utils/navigationRef';

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const LoungeStack = createNativeStackNavigator();
const ChatStack = createNativeStackNavigator();
const MyPageStack = createNativeStackNavigator();

const headerCommonOptions = {
  headerTintColor: colors.textPrimary,
  headerStyle: { backgroundColor: colors.surface },
  headerTitleStyle: { ...typography.sectionTitle, color: colors.textPrimary },
};

// 홈 탭: 매물 목록 → 상세 → 매물 등록
const HomeStackNavigator = () => (
  <HomeStack.Navigator>
    <HomeStack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
    <HomeStack.Screen
      name="ItemDetail"
      component={ItemDetailScreen}
      options={{ title: '매물 상세', headerBackTitle: '목록', ...headerCommonOptions }}
    />
    <HomeStack.Screen
      name="WriteItem"
      component={WriteItemScreen}
      options={{ title: '판매 매물 등록', headerBackTitle: '취소', ...headerCommonOptions, presentation: 'modal' }}
    />
  </HomeStack.Navigator>
);

// 라운지 탭: 게시글 목록 → 상세 → 글쓰기
const LoungeStackNavigator = () => (
  <LoungeStack.Navigator>
    <LoungeStack.Screen name="Lounge" component={LoungeScreen} options={{ headerShown: false }} />
    <LoungeStack.Screen
      name="PostDetail"
      component={PostDetailScreen}
      options={{ title: '게시글', headerBackTitle: '목록', ...headerCommonOptions }}
    />
    <LoungeStack.Screen
      name="WritePost"
      component={WritePostScreen}
      options={{ title: '글쓰기', headerBackTitle: '취소', ...headerCommonOptions, presentation: 'modal' }}
    />
  </LoungeStack.Navigator>
);

// 채팅 탭
const ChatStackNavigator = () => (
  <ChatStack.Navigator>
    <ChatStack.Screen name="ChatList" component={ChatListScreen} options={{ headerShown: false }} />
  </ChatStack.Navigator>
);

// 내 정보 탭 - Login/SignUp은 RootStack으로 이동했으므로 MyPage만 관리
const MyPageStackNavigator = () => (
  <MyPageStack.Navigator>
    <MyPageStack.Screen name="MyPage" component={MyPageScreen} options={{ headerShown: false }} />
  </MyPageStack.Navigator>
);

// 하단 탭 네비게이터 - 마켓 | 라운지 | 채팅 | 내 정보
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textDisabled,
      tabBarStyle: { borderTopColor: colors.border, backgroundColor: colors.surface },
      tabBarLabelStyle: { ...typography.caption },
      tabBarIcon: ({ focused, color, size }) => {
        const iconMap = {
          HomeTab:   focused ? 'storefront'           : 'storefront-outline',
          LoungeTab: focused ? 'chatbubbles'          : 'chatbubbles-outline',
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
//
// [Login/SignUp을 RootStack에 배치한 이유]
// 인증 가드(useAuth)는 마켓·라운지·채팅 탭 어느 곳에서도 발동될 수 있다.
// 각 탭 스택에 Login을 중복 등록하면 라우트 이름이 충돌하고 관리가 어려워진다.
// RootStack에 한 번만 등록하면 navigation.navigate('Login') 한 줄로
// 어느 화면에서도 로그인 모달을 띄울 수 있다.
const AppNavigator = () => (
  <NavigationContainer ref={navigationRef}>
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Main" component={MainTabs} />

      {/* 채팅방 - 어느 탭에서든 진입 가능 */}
      <RootStack.Screen
        name="ChatRoom"
        component={ChatRoomScreen}
        options={{ headerShown: true, headerBackTitle: '뒤로', ...headerCommonOptions, presentation: 'card' }}
      />

      {/* 인증 화면 - 전역 모달로 어느 탭에서든 navigate('Login') 호출 가능 */}
      <RootStack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: true, title: '로그인', headerBackTitle: '뒤로', ...headerCommonOptions, presentation: 'modal' }}
      />
      <RootStack.Screen
        name="SignUp"
        component={SignUpScreen}
        options={{ headerShown: true, title: '회원가입', headerBackTitle: '뒤로', ...headerCommonOptions, presentation: 'modal' }}
      />
    </RootStack.Navigator>
  </NavigationContainer>
);

export default AppNavigator;
