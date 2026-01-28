import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { createContext, useContext, useRef } from 'react';
import { View } from 'react-native';
import Notification, { NotificationHandle } from '../components/notification';

// 1. นิยามประเภทของฟังก์ชัน (รับ string หรือไม่รับก็ได้ เพื่อแก้ Error Arguments)
type NotiFunc = (msg?: string) => void;

// 2. สร้าง Context
const NotificationContext = createContext<NotiFunc>(() => {});

// 3. Hook สำหรับเรียกใช้ในหน้าอื่น
export const useNotification = () => useContext(NotificationContext);

export default function RootLayout() {
  const notificationRef = useRef<NotificationHandle>(null);

  // 4. ฟังก์ชัน Toggle (สลับเปิด-ปิด)
  const toggleNotification = () => {
    if (notificationRef.current) {
      if (notificationRef.current.isVisible) {
        notificationRef.current.hide();
      } else {
        notificationRef.current.show();
      }
    }
  };

  return (
    <NotificationContext.Provider value={toggleNotification}>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" /> 
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