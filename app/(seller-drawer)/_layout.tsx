import { Ionicons } from "@expo/vector-icons";
import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { router } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { useEffect, useState } from "react";
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
import { apiRequest } from "../../utils/api";
import { clearTokens, getAccessToken } from "../../utils/token";

interface User {
  id: string;
  fullName: string;
  year: number;
  faculty: string;
  photoUrl?: string;
}

function CustomDrawerContent(props: any) {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await getAccessToken();
        if (!token) return;

        const response = await apiRequest("/users/me", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setUser({
            id: data.id,
            fullName: data.name,
            year: data.studentYear,
            faculty: data.faculty ?? "-",
            photoUrl: data.userPhotoUrl ?? undefined,
          });
        }
      } catch (error) {
        console.error("SELLER DRAWER FETCH USER ERROR:", error);
      }
    };

    fetchUser();
  }, []);

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
        {/* Header */}
        <View style={styles.sidebarHeader}>
          <Text style={styles.logoText}>GROWTHSHEET</Text>
          <Text style={styles.logoSub}>Seller Studio</Text>
        </View>

        <View style={styles.drawerListContainer}>
          <DrawerItemList {...props} />
        </View>

        <View style={styles.divider} />

        {/* Back to buyer */}
        <TouchableOpacity
          style={styles.switchBtn}
          onPress={() => router.replace("/home")}
          activeOpacity={0.8}
        >
          <Ionicons name="storefront-outline" size={18} color="#6C63FF" />
          <Text style={styles.switchBtnText}>กลับหน้าผู้ซื้อ</Text>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
          <Text style={styles.logoutText}>ออกจากระบบ</Text>
        </TouchableOpacity>
      </DrawerContentScrollView>

      {/* User Footer — matching buyer drawer */}
      <TouchableOpacity style={styles.userFooter}>
        {user?.photoUrl ? (
          <Image source={{ uri: user.photoUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text>👤</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.userName} numberOfLines={1}>
            {user?.fullName ?? "กำลังโหลด..."}
          </Text>
          <Text style={styles.userStatus} numberOfLines={1}>
            {user ? `ปี ${user.year} • ${user.faculty}` : ""}
          </Text>
        </View>
      </TouchableOpacity>
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
          name="sales-analysis"
          options={{
            drawerLabel: "วิเคราะห์ยอดขาย",
            title: "วิเคราะห์ยอดขาย",
            drawerIcon: ({ color }) => (
              <Ionicons name="pie-chart-outline" size={22} color={color} />
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
  sidebarHeader: {
    padding: 30,
    alignItems: "center",
    paddingTop: 60,
  },
  logoText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#6C63FF",
  },
  logoSub: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
    fontWeight: "600",
  },
  drawerListContainer: {
    paddingTop: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "#EEE",
    marginVertical: 10,
    marginHorizontal: 20,
  },
  switchBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 6,
    paddingVertical: 11,
    paddingHorizontal: 18,
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(108, 99, 255, 0.15)",
  },
  switchBtnText: {
    fontSize: 14,
    color: "#6C63FF",
    marginLeft: 8,
    fontWeight: "600",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  logoutText: {
    color: "#FF3B30",
    fontSize: 15,
    marginLeft: 12,
    fontWeight: "500",
  },
  userFooter: {
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#EEE",
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#DDD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userName: {
    fontWeight: "bold",
    fontSize: 16,
  },
  userStatus: {
    fontSize: 12,
    color: "#666",
  },
});
