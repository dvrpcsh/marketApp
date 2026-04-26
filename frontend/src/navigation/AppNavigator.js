import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';
import ChatScreen from '../screens/ChatScreen';
import MyPageScreen from '../screens/MyPageScreen';
import SignUpScreen from '../screens/SignUpScreen';
import { colors, typography } from '../constants/theme';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const MyPageStack = createNativeStackNavigator();

// 홈 탭 스택: 목록 → 상세 흐름을 스택으로 관리
// 뒤로가기 시 목록으로 자연스럽게 복귀 - 당근마켓과 동일한 UX 패턴
const HomeStackNavigator = () => (
  <HomeStack.Navigator>
    <HomeStack.Screen
      name="Home"
      component={HomeScreen}
      options={{ headerShown: false }} // 커스텀 헤더를 각 화면에서 직접 관리
    />
    <HomeStack.Screen
      name="ItemDetail"
      component={ItemDetailScreen}
      options={{ title: '매물 상세', headerBackTitle: '목록' }}
    />
  </HomeStack.Navigator>
);

// 내 정보 탭 스택: 회원가입 등 인증 관련 화면을 이 스택 안에 포함
// → 인증 완료 후 goBack()으로 내 정보 화면으로 자연스럽게 복귀
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
  </MyPageStack.Navigator>
);

// 하단 탭 네비게이터 - 앱의 최상위 네비게이션 구조
// 추후 탭 추가 시(커뮤니티, 시세 등) 이 파일에서만 수정
const AppNavigator = () => (
  <NavigationContainer>
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
          // 탭별 아이콘 - 활성 상태는 채워진 아이콘, 비활성은 아웃라인 아이콘으로 구분
          const iconMap = {
            HomeTab:   focused ? 'storefront'         : 'storefront-outline',
            ChatTab:   focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline',
            MyPageTab: focused ? 'person'              : 'person-outline',
          };
          return <Ionicons name={iconMap[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab"   component={HomeStackNavigator}   options={{ title: '마켓' }} />
      <Tab.Screen name="ChatTab"   component={ChatScreen}           options={{ title: '채팅' }} />
      <Tab.Screen name="MyPageTab" component={MyPageStackNavigator} options={{ title: '내 정보' }} />
    </Tab.Navigator>
  </NavigationContainer>
);

export default AppNavigator;
