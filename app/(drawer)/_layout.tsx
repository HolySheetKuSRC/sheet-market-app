import { Ionicons } from "@expo/vector-icons";
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItem,
} from "@react-navigation/drawer";
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

import { apiRequest } from '../../utils/api';
import {
  clearTokens,
  getAccessToken
} from '../../utils/token';

interface User {
  id: string;
  fullName: string;
  year: number;
  faculty: string;
  photoUrl?: string;
}

const CustomDrawerContent = (props: DrawerContentComponentProps) => {
  const { navigation, state } = props;
  const router = useRouter();
  const focusedRouteName = state.routeNames[state.index];
  const THEME_COLOR = "#6C63FF";

  const [user, setUser] = useState<User | null>(null);
  const [isSeller, setIsSeller] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log("===== DRAWER FETCH USER START =====");

        const token = await getAccessToken();
        console.log("ACCESS TOKEN SENT >>>", token);

        if (!token) {
          console.log("No token found");
          return;
        }

        const response = await apiRequest("/users/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("Status:", response.status);
        console.log("OK:", response.ok);

        const rawText = await response.text();
        console.log("Raw response:", rawText);

        let data: any = null;

        try {
          data = JSON.parse(rawText);
          console.log("Parsed JSON:", data);
        } catch (e) {
          console.log("Response is not JSON");
        }

        if (!response.ok) {
          console.error("API ERROR:", response.status);
          return;
        }

        if (data) {
          // 🔥 ดู field จริงก่อน
          console.log("Available fields:", Object.keys(data));

          setUser({
            id: data.id,
            fullName: data.name,
            year: data.studentYear,
            faculty: data.faculty ?? "-",
            photoUrl: data.userPhotoUrl ?? undefined,
          });
        }

        const statusRes = await apiRequest("/users/page-status", {
          method: "GET",
        });
        const statusText = await statusRes.text();
        console.log("Seller Status:", statusText);

        if (statusText === "SELLER_PAGE" || statusText === "NEED_REFRESH") {
          setIsSeller(true);
        }

        console.log("===== DRAWER FETCH USER END =====");
      } catch (error) {
        console.error("FETCH USER ERROR:", error);
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
        navigation.navigate("login" as any);
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
    <View style={{ flex: 1, backgroundColor: "#FFF" }}>
      <View style={styles.sidebarHeader}>
        <Text style={styles.logoText}>GROWTHSHEET</Text>
      </View>

      <DrawerContentScrollView {...props}>
        <DrawerItem
          label="หน้าหลัก"
          focused={focusedRouteName === "home"}
          activeTintColor={THEME_COLOR}
          activeBackgroundColor="#EEF2FF"
          icon={({ color }) => (
            <Ionicons name="home-outline" size={24} color={color} />
          )}
          onPress={() => navigation.navigate("home")}
        />

        <DrawerItem
          label="ซื้อขายชีทสรุป"
          focused={focusedRouteName === "marketplace"}
          activeTintColor={THEME_COLOR}
          activeBackgroundColor="#EEF2FF"
          icon={({ color }) => (
            <Ionicons name="bag-handle-outline" size={24} color={color} />
          )}
          onPress={() => navigation.navigate("marketplace")}
        />

        <View style={styles.divider} />
        <Text style={styles.menuGroupTitle}>ตัวช่วยพิเศษ</Text>

        <DrawerItem
          label="สมัครเป็นผู้ขาย"
          focused={focusedRouteName === "become-seller"}
          activeTintColor={THEME_COLOR}
          activeBackgroundColor="#EEF2FF"
          icon={({ color }) => (
            <Ionicons name="storefront-outline" size={24} color={color} />
          )}
          onPress={() => navigation.navigate("become-seller")}
        />

        <DrawerItem
          label="ถอดเสียงเลคเชอร์"
          focused={focusedRouteName === "transcribe"}
          activeTintColor={THEME_COLOR}
          activeBackgroundColor="#EEF2FF"
          icon={({ color }) => (
            <Ionicons name="mic-outline" size={24} color={color} />
          )}
          onPress={() => navigation.navigate("transcribe")}
        />

        <DrawerItem
          label="คลังของฉัน"
          focused={focusedRouteName === "myLibrary"}
          activeTintColor={THEME_COLOR}
          activeBackgroundColor="#EEF2FF"
          icon={({ color }) => (
            <Ionicons name="library-outline" size={24} color={color} />
          )}
          onPress={() => navigation.navigate("myLibrary")}
        />

        <DrawerItem
          label="รายการสั่งซื้อ"
          focused={focusedRouteName === "order"}
          activeTintColor={THEME_COLOR}
          activeBackgroundColor="#EEF2FF"
          icon={({ color }) => (
            <Ionicons name="receipt-outline" size={24} color={color} />
          )}
          onPress={() => navigation.navigate("order")}
        />

        <DrawerItem
          label="ตะกร้าสินค้า"
          focused={focusedRouteName === "cart"}
          activeTintColor={THEME_COLOR}
          activeBackgroundColor="#EEF2FF"
          icon={({ color }) => (
            <Ionicons name="cart-outline" size={24} color={color} />
          )}
          onPress={() => navigation.navigate("cart")}
        />

        {isSeller && (
          <DrawerItem
            label="หน้าต่างผู้ขาย"
            focused={focusedRouteName === "seller-dashboard"}
            activeTintColor="#FFF"
            activeBackgroundColor={THEME_COLOR}
            inactiveTintColor={THEME_COLOR}
            inactiveBackgroundColor="#F4F3FF"
            labelStyle={{ fontWeight: "bold" }}
            style={{
              borderWidth: 1,
              borderColor: "rgba(108, 99, 255, 0.3)", // เส้นขอบสีม่วงจางๆ
              marginVertical: 10, // เพิ่มระยะห่างบนล่างให้ดูเป็นปุ่มแยกออกมา
            }}
            icon={({ color }) => (
              <Ionicons name="business" size={24} color={color} />
            )}
            onPress={() => router.replace("/(seller-drawer)/seller-dashboard")}
          />
        )}

        <View style={styles.divider} />

        <DrawerItem
          label="ออกจากระบบ"
          icon={() => <Ionicons name="log-out-outline" size={24} color="red" />}
          labelStyle={{ color: "red" }}
          onPress={handleLogout}
        />
      </DrawerContentScrollView>

      <TouchableOpacity
        style={styles.userFooter}
        onPress={() => navigation.navigate("profile")}
      >
        {user?.photoUrl ? (
          <Image source={{ uri: user.photoUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text>👤</Text>
          </View>
        )}

        <View>
          <Text style={styles.userName}>
            {user?.fullName ?? "กำลังโหลด..."}
          </Text>
          <Text style={styles.userStatus}>
            {user ? `ปี ${user.year} • ${user.faculty}` : ""}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default function DrawerLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        backBehavior="history"
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerShown: false,
          drawerType: "front",
        }}
      >
        <Drawer.Screen name="home" />
        <Drawer.Screen name="marketplace" />
        <Drawer.Screen name="become-seller" />
        <Drawer.Screen name="transcribe" />
        <Drawer.Screen name="myLibrary" />
        <Drawer.Screen name="order" />
        <Drawer.Screen name="cart" />
        <Drawer.Screen name="profile" />
      </Drawer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  sidebarHeader: { padding: 30, alignItems: "center", paddingTop: 60 },
  logoText: { fontSize: 20, fontWeight: "900", color: "#6C63FF" },
  divider: {
    height: 1,
    backgroundColor: "#EEE",
    marginVertical: 10,
    marginHorizontal: 20,
  },
  menuGroupTitle: {
    marginLeft: 20,
    marginBottom: 10,
    color: "#FF69B4",
    fontSize: 12,
    fontWeight: "bold",
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
  userName: { fontWeight: "bold", fontSize: 16 },
  userStatus: { fontSize: 12, color: "#666" },
});
