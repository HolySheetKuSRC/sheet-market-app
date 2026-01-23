import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        {/* หน้า Login */}
        <Stack.Screen name="index" /> 
        
        {/* กลุ่ม Drawer (Sidebar) */}
        <Stack.Screen name="(drawer)" /> 

        {/* หน้ารายละเอียด (Stack ซ้อนทับ Drawer) */}
        <Stack.Screen name="sheet/[id]" options={{ presentation: 'card', headerShown: false }} />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}