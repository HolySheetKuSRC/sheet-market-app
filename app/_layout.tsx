import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import Notification, { NotificationHandle } from '../components/notification';
import { getAccessToken } from './utils/token';

type NotiFunc = (msg?: string) => void;
const NotificationContext = createContext<NotiFunc>(() => {});
export const useNotification = () => useContext(NotificationContext);

export default function RootLayout() {
  const notificationRef = useRef<NotificationHandle>(null);
  const [isReady, setIsReady] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  const checkAuth = async () => {
    try {
      const token = await getAccessToken();
      const currentSegment = segments[0] as string | undefined;
      
      const isAtRoot = !currentSegment;
      const inAuthGroup = isAtRoot || currentSegment === 'login';
      const inProtectedGroup = currentSegment === '(drawer)' || currentSegment === 'cart';

      if (!token && inProtectedGroup) {
        router.replace('/login');
      } 
      else if (token && inAuthGroup) {
        router.replace('/(drawer)/home');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsReady(true);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [segments]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <NotificationContext.Provider value={() => {}}>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" options={{ gestureEnabled: false }} /> 
          <Stack.Screen name="(drawer)" /> 
          <Stack.Screen name="sheet/[id]" options={{ presentation: 'card' }} />
        </Stack>
        <StatusBar style="dark" />
        <Notification ref={notificationRef} />
      </View>
    </NotificationContext.Provider>
  );
}