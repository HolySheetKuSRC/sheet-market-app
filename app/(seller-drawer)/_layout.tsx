import { Ionicons } from "@expo/vector-icons";
import { Drawer } from "expo-router/drawer";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function SellerLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        screenOptions={{ headerShown: true, drawerActiveTintColor: "#6C63FF" }}
      >
        {/* หน้าหลักของผู้ขาย */}
        <Drawer.Screen
          name="seller-dashboard"
          options={{
            drawerLabel: "แดชบอร์ดผู้ขาย",
            title: "Dashboard",
            drawerIcon: ({ color }) => (
              <Ionicons name="stats-chart-outline" size={22} color={color} />
            ),
          }}
        />
        {/* คุณสามารถเพิ่มหน้าอื่นๆ เช่น 'manage-sheets' ได้ที่นี่ในอนาคต */}
      </Drawer>
    </GestureHandlerRootView>
  );
}
