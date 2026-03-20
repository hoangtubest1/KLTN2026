import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';

import { AuthProvider } from './src/context/AuthContext';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import BookingsScreen from './src/screens/BookingsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import FacilityDetailScreen from './src/screens/FacilityDetailScreen';
import FieldsListScreen from './src/screens/FieldsListScreen';
import BookingScreen from './src/screens/BookingScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import ReviewScreen from './src/screens/ReviewScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const HEADER = {
  headerStyle: { backgroundColor: '#18458B' },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '700', fontSize: 16 },
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        ...HEADER,
        tabBarActiveTintColor: '#18458B',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          height: 62, paddingBottom: 8, paddingTop: 4,
          borderTopWidth: 1, borderTopColor: '#e5e7eb', backgroundColor: '#fff',
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Trang Chủ',
          tabBarLabel: 'Trang Chủ',
          tabBarIcon: ({ color, size }) => <Text style={{ fontSize: size - 2, color }}>🏠</Text>,
          headerTitle: '🏟️ TìmSân',
        }}
      />
      <Tab.Screen
        name="FieldsList"
        component={FieldsListScreen}
        options={{
          title: 'Tìm Sân',
          tabBarLabel: 'Tìm Sân',
          tabBarIcon: ({ color, size }) => <Text style={{ fontSize: size - 2, color }}>🔍</Text>,
        }}
      />
      <Tab.Screen
        name="Bookings"
        component={BookingsScreen}
        options={{
          title: 'Lịch Đặt',
          tabBarLabel: 'Lịch Đặt',
          tabBarIcon: ({ color, size }) => <Text style={{ fontSize: size - 2, color }}>📅</Text>,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Tài Khoản',
          tabBarLabel: 'Tài Khoản',
          tabBarIcon: ({ color, size }) => <Text style={{ fontSize: size - 2, color }}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

function RootStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />

      {/* Auth */}
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Đăng nhập', ...HEADER }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Đăng ký', ...HEADER }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Quên mật khẩu', ...HEADER }} />

      {/* Facility flow */}
      <Stack.Screen
        name="FacilityDetail"
        component={FacilityDetailScreen}
        options={({ route }) => ({ title: route.params?.facility?.name || 'Chi tiết sân', ...HEADER })}
      />
      <Stack.Screen
        name="Booking"
        component={BookingScreen}
        options={({ route }) => ({ title: `Đặt sân: ${route.params?.facility?.name || ''}`, ...HEADER })}
      />
      <Stack.Screen
        name="Payment"
        component={PaymentScreen}
        options={{ title: 'Thanh toán', ...HEADER }}
      />

      {/* Post-booking */}
      <Stack.Screen
        name="Review"
        component={ReviewScreen}
        options={{ title: 'Đánh giá sân', ...HEADER }}
      />

      {/* Profile */}
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Chỉnh sửa hồ sơ', ...HEADER }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="light" backgroundColor="#18458B" />
        <RootStack />
      </NavigationContainer>
    </AuthProvider>
  );
}
