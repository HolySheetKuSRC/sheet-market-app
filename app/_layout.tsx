import { apiRequest } from "@/utils/api";
import { registerForPushNotificationsAsync } from "@/utils/pushNotification";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import Notification, { NotificationHandle } from "../components/notification";
import { CartProvider } from "../context/CartContext";
import { getAccessToken } from "../utils/token";

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
      const inAuthGroup = isAtRoot || currentSegment === "login";
      const inProtectedGroup =
        currentSegment === "(drawer)" || currentSegment === "cart";

      if (!token && inProtectedGroup) {
        router.replace("/login");
      } else if (token && inAuthGroup) {
        router.replace("/(drawer)/home");
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

  const init = async () => {
    const tokenExpo = await registerForPushNotificationsAsync();
    console.log("Push Token", tokenExpo);
    if (!tokenExpo) return;
    await apiRequest("/userdevice/expo-token", {
      method: "POST",
      body: JSON.stringify({ token: tokenExpo, deviceType: "android" }),
    });
  };

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  const notify = (msg?: string) => {
    notificationRef.current?.show(msg || "Notification");
  };

  return (
    <SafeAreaProvider>
      <NotificationContext.Provider value={notify}>
        <CartProvider>
          <View style={{ flex: 1 }}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="login" options={{ gestureEnabled: false }} />
              
              <Stack.Screen name="(drawer)" />
              <Stack.Screen
                name="sheet/[id]"
                options={{ presentation: "card" }}
              />
              
              <Stack.Screen name="forgot-password" />
            </Stack>

            <StatusBar style="dark" />
            <Notification ref={notificationRef} />
            <Toast />
          </View>
        </CartProvider>
      </NotificationContext.Provider>
    </SafeAreaProvider>
  );
}