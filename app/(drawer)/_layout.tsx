import { Ionicons } from '@expo/vector-icons';
import { DrawerContentComponentProps, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { Drawer } from 'expo-router/drawer';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// ✅ นำเข้า clearTokens จาก app/utils/token.ts
import { clearTokens } from '../utils/token';

const CustomDrawerContent = (props: DrawerContentComponentProps) => {
  const { navigation, state } = props;
  const focusedRouteName = state.routeNames[state.index];
  const THEME_COLOR = '#6C63FF';

  const handleLogout = () => {
    const performLogout = async () => {
      try {
        await clearTokens();
        if (Platform.OS === 'web') {
          window.location.href = '/login';
        } else {
          navigation.navigate('login' as any);
        }
      } catch (error) {
        console.error("Logout Error:", error);
      }
    };

    if (Platform.OS === 'web') {
      if (confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) performLogout();
    } else {
      Alert.alert("ออกจากระบบ", "คุณต้องการออกจากระบบใช่หรือไม่?", [
        { text: "ยกเลิก", style: "cancel" },
        { text: "ยืนยัน", style: "destructive", onPress: performLogout }
      ]);
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
          onPress={() => navigation.navigate('home')}
        />

        <DrawerItem
          label="ซื้อขายชีทสรุป"
          focused={focusedRouteName === 'marketplace'}
          activeTintColor={THEME_COLOR}
          activeBackgroundColor="#EEF2FF"
          icon={({ color }) => <Ionicons name="bag-handle-outline" size={24} color={color} />}
          onPress={() => navigation.navigate('marketplace')}
        />

        <View style={styles.divider} />
        <Text style={styles.menuGroupTitle}>ตัวช่วยพิเศษ</Text>

        <DrawerItem
          label="สมัครเป็นผู้ขาย"
          focused={focusedRouteName === 'become-seller'}
          activeTintColor={THEME_COLOR}
          activeBackgroundColor="#EEF2FF"
          icon={({ color }) => <Ionicons name="storefront-outline" size={24} color={color} />}
          onPress={() => navigation.navigate('become-seller')}
        />

        <DrawerItem
          label="รายการโปรด"
          focused={focusedRouteName === 'favorite'}
          activeTintColor={THEME_COLOR}
          activeBackgroundColor="#EEF2FF"
          icon={({ color }) => <Ionicons name="heart-outline" size={24} color={color} />}
          onPress={() => navigation.navigate('favorite')}
        />

        <View style={styles.divider} />
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
        onPress={() => navigation.navigate('cart')}
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

export default function DrawerLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        // ✅ แก้ไข: ย้าย backBehavior ออกมาไว้นอก screenOptions
        backBehavior="history"
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerShown: false,
          drawerType: 'front',
        }}
      >
        <Drawer.Screen name="home" />
        <Drawer.Screen name="marketplace" />
        <Drawer.Screen name="become-seller" />
        <Drawer.Screen name="favorite" />
      </Drawer>
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