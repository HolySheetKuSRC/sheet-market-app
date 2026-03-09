import { Ionicons } from "@expo/vector-icons";
import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { Drawer } from "expo-router/drawer";
import {
  Alert,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { clearTokens } from "../../utils/token";

function CustomDrawerContent(props: any) {
  const insets = useSafeAreaInsets();

  const handleLogout = () => {
    const performLogout = async () => {
      await clearTokens();
      if (Platform.OS === "web") {
        window.location.href = "/login";
      } else {
        props.navigation.navigate("login" as any);
      }
    };

    if (Platform.OS === "web") {
      if (confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) performLogout();
    } else {
      Alert.alert("ออกจากระบบ", "คุณต้องการออกจากระบบใช่หรือไม่?", [
        { text: "ยกเลิก", style: "cancel" },
        { text: "ยืนยัน", style: "destructive", onPress: performLogout },
      ]);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ paddingTop: 0 }}
      >
        {/* Header Background */}
        <View
          style={[styles.headerBackground, { paddingTop: insets.top + 20 }]}
        >
          <Image
            source={{
              uri: "https://ui-avatars.com/api/?name=Seller+Shop&background=ffffff&color=6C63FF&size=100",
            }}
            style={styles.profileImage}
          />
          <Text style={styles.userName}>ร้านค้าของฉัน</Text>
          <Text style={styles.userEmail}>seller@example.com</Text>
        </View>

        <View style={styles.drawerListContainer}>
          <DrawerItemList {...props} />
        </View>
      </DrawerContentScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
          <Text style={styles.logoutText}>ออกจากระบบ</Text>
        </TouchableOpacity>
        <Text style={styles.versionText}>เวอร์ชัน 1.0.0</Text>
      </View>
    </View>
  );
}

export default function SellerLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerShown: true,
          drawerActiveBackgroundColor: "#F0EFFF",
          drawerActiveTintColor: "#6C63FF",
          drawerInactiveTintColor: "#333",
          drawerLabelStyle: { fontSize: 16, marginLeft: -10 },
          headerStyle: {
            backgroundColor: "#fff",
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTitleStyle: { fontWeight: "bold" },
        }}
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
        <Drawer.Screen
          name="create-sheet"
          options={{
            drawerLabel: "สร้างชีตใหม่",
            title: "Create Sheet",
            drawerIcon: ({ color }) => (
              <Ionicons name="add-circle-outline" size={22} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="my-sheets"
          options={{
            drawerLabel: "ชีทที่ฉันขาย",
            title: "ชีทที่ฉันขาย",
            drawerIcon: ({ color }) => (
              <Ionicons name="document-text-outline" size={22} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="withdrawal"
          options={{
            drawerLabel: "ถอนเงิน",
            title: "ถอนเงิน",
            drawerIcon: ({ color }) => (
              <Ionicons name="cash-outline" size={22} color={color} />
            ),
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  headerBackground: {
    backgroundColor: "#6C63FF",
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: "center",
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
    borderWidth: 3,
    borderColor: "#ffffff",
  },
  userName: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  userEmail: {
    color: "#e0e0e0",
    fontSize: 14,
  },
  drawerListContainer: {
    paddingTop: 10,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    padding: 20,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  logoutText: {
    color: "#FF3B30",
    fontSize: 16,
    marginLeft: 10,
    fontWeight: "500",
  },
  versionText: {
    color: "#999",
    fontSize: 12,
    textAlign: "center",
  },
});
