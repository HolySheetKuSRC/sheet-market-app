import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import Notification, { NotificationHandle } from '../components/notification';
// นำเข้า getAccessToken เพื่อใช้เช็คสิทธิ์
import { getAccessToken } from './utils/token';

// 1. นิยามประเภทของฟังก์ชัน Notification
type NotiFunc = (msg?: string) => void;

// 2. สร้าง Context
const NotificationContext = createContext<NotiFunc>(() => {});

// 3. Hook สำหรับเรียกใช้ในหน้าอื่น
export const useNotification = () => useContext(NotificationContext);

export default function RootLayout() {
  const notificationRef = useRef<NotificationHandle>(null);
  const [isReady, setIsReady] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  
  const segments = useSegments();
  const router = useRouter();

  // 4. ตรวจสอบ Token เมื่อ App เริ่มทำงาน
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = await getAccessToken();
        setHasToken(!!token);
      } catch (e) {
        setHasToken(false);
      } finally {
        setIsReady(true);
      }
    };
    initializeAuth();
  }, []);

  // 5. จัดการระบบ Redirect (Guard)
  useEffect(() => {
    if (!isReady) return;

    // เช็คว่าตอนนี้อยู่ที่กลุ่มหน้า Auth หรือไม่ (เช่นหน้า login)
    // หมายเหตุ: ปรับชื่อ 'login' ให้ตรงกับชื่อไฟล์หน้า Login ของคุณ
    const inAuthGroup = segments[0] === 'login';

    if (!hasToken && !inAuthGroup) {
      // ถ้าไม่มี Token และไม่ได้อยู่หน้า Login -> ไปหน้า Login
      router.replace('/login');
    } else if (hasToken && inAuthGroup) {
      // ถ้ามี Token แล้วแต่หลงมาหน้า Login -> ไปหน้าหลัก
      router.replace('/(drawer)/home');
    }
  }, [hasToken, isReady, segments]);

  // 6. ฟังก์ชัน Toggle Notification
  const toggleNotification = () => {
    if (notificationRef.current) {
      if (notificationRef.current.isVisible) {
        notificationRef.current.hide();
      } else {
        notificationRef.current.show();
      }
    }
  };

  // ระหว่างที่รอเช็ค Token ให้แสดง Loading ก่อนเพื่อป้องกันหน้าขาวหรือกระพริบ
  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <NotificationContext.Provider value={toggleNotification}>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          {/* กำหนดชื่อ Screen ให้ตรงกับโครงสร้างไฟล์ของคุณ */}
          <Stack.Screen name="login" options={{ gestureEnabled: false }} /> 
          <Stack.Screen name="(drawer)" /> 
          <Stack.Screen 
            name="sheet/[id]" 
            options={{ presentation: 'card', headerShown: false }} 
          />
        </Stack>
        
        <StatusBar style="dark" />

        {/* วาง Notification ไว้เลเยอร์บนสุด */}
        <Notification ref={notificationRef} />
      </View>
    </NotificationContext.Provider>
  );
}