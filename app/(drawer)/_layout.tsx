import { Ionicons } from '@expo/vector-icons';
import { DrawerContentComponentProps, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native'; // เพิ่ม Platform
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { clearTokens } from '../utils/token';

const CustomDrawerContent = (props: DrawerContentComponentProps) => {
  const router = useRouter();
  const focusedRouteName = props.state.routeNames[props.state.index];
  const THEME_COLOR = '#6C63FF';

  // --- ฟังก์ชัน Logout ที่รองรับ Web ---
  const handleLogout = async () => {
    console.log("Logout button clicked");

    const performLogout = async () => {
      try {
        console.log("Starting clearTokens...");
        await clearTokens(); 
        console.log("Tokens cleared successfully");
        
        // ใช้ setTimeout เล็กน้อยเพื่อให้แน่ใจว่า storage ทำงานเสร็จ
        setTimeout(() => {
          router.replace('/' as any);
        }, 50);
      } catch (error) {
        console.error("Logout Error:", error);
      }
    };

    // เช็คว่าถ้าเป็น Web ให้ใช้ confirm ของ browser แทน Alert.alert เพื่อเลี่ยง bug ARIA
    if (Platform.OS === 'web') {
      if (window.confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) {
        await performLogout();
      }
    } else {
      // สำหรับ Mobile (iOS/Android) ใช้ Alert.alert ปกติ
      Alert.alert(
        "ออกจากระบบ",
        "คุณต้องการออกจากระบบใช่หรือไม่?",
        [
          { text: "ยกเลิก", style: "cancel" },
          { text: "ยืนยัน", style: "destructive", onPress: performLogout }
        ]
      );
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFF' }}>
      <View style={styles.sidebarHeader}>
        <Text style={styles.logoText}>GROWTHSHEET</Text>
      </View>

      <DrawerContentScrollView {...props}>
        <DrawerItem
          label="หน้าหลัก"
          focused={focusedRouteName === 'home'}
          activeTintColor={THEME_COLOR}
          activeBackgroundColor="#EEF2FF"
          icon={({ color }) => <Ionicons name="home-outline" size={24} color={color} />}
          onPress={() => router.push('/(drawer)/home' as any)}
        />

        <DrawerItem
          label="ซื้อขายชีทสรุป"
          focused={focusedRouteName === 'marketplace'}
          activeTintColor={THEME_COLOR}
          activeBackgroundColor="#EEF2FF"
          icon={({ color }) => <Ionicons name="bag-handle-outline" size={24} color={color} />}
          onPress={() => router.push('/(drawer)/marketplace' as any)}
        />

        <View style={styles.divider} />
        <Text style={styles.menuGroupTitle}>ตัวช่วยพิเศษ</Text>

        <DrawerItem
          label="รายการโปรด"
          focused={focusedRouteName === 'favorite'}
          activeTintColor={THEME_COLOR}
          activeBackgroundColor="#EEF2FF"
          icon={({ color }) => <Ionicons name="heart-outline" size={24} color={color} />}
          onPress={() => router.push('/(drawer)/favorite' as any)}
        />

        <DrawerItem
          label="ออกจากระบบ"
          icon={() => <Ionicons name="log-out-outline" size={24} color="red" />}
          labelStyle={{ color: 'red' }}
          onPress={handleLogout} 
        />
      </DrawerContentScrollView>

      <DrawerItem
        label="ตะกร้าสินค้า"
        focused={focusedRouteName === 'cart'}
        activeTintColor={THEME_COLOR}
        activeBackgroundColor="#EEF2FF"
        icon={({ color }) => <Ionicons name="cart-outline" size={24} color={color} />}
        onPress={() => router.push('/cart' as any)}
      />

      <View style={styles.userFooter}>
        <View style={styles.avatarPlaceholder}><Text>🐷</Text></View>
        <View>
          <Text style={styles.userName}>ออมมี่</Text>
          <Text style={styles.userStatus}>ปี 3 • วิศวะคอม</Text>
        </View>
      </View>
    </View>
  );
};

// ... DrawerLayout และ Styles เหมือนเดิม ...
export default function DrawerLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerShown: false,
          drawerType: 'front',
        }}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  sidebarHeader: { padding: 30, alignItems: 'center', paddingTop: 60 },
  logoText: { fontSize: 20, fontWeight: '900', color: '#6C63FF' },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 10, marginHorizontal: 20 },
  menuGroupTitle: { marginLeft: 20, marginBottom: 10, color: '#FF69B4', fontSize: 12, fontWeight: 'bold' },
  userFooter: { padding: 20, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#EEE', marginBottom: 20 },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#DDD', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  userName: { fontWeight: 'bold', fontSize: 16 },
  userStatus: { fontSize: 12, color: '#666' },
});