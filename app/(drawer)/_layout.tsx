import { Ionicons } from '@expo/vector-icons';
import { DrawerContentComponentProps, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const CustomDrawerContent = (props: DrawerContentComponentProps) => {
  const router = useRouter();

  // หาชื่อหน้าปัจจุบันจาก props.state
  const focusedRouteName = props.state.routeNames[props.state.index];

  const THEME_COLOR = '#6C63FF';

  return (
    <View style={{ flex: 1, backgroundColor: '#FFF' }}>
      <View style={styles.sidebarHeader}>
        <Text style={styles.logoText}>GROWTHSHEET</Text>
      </View>

      <DrawerContentScrollView {...props}>
        {/* เมนูหน้าหลัก */}
        <DrawerItem
          label="หน้าหลัก (Home)"
          focused={focusedRouteName === 'home'} // เช็คว่าตรงกับชื่อไฟล์ home.tsx ไหม
          activeTintColor={THEME_COLOR}
          activeBackgroundColor="#EEF2FF"
          icon={({ color }) => <Ionicons name="home-outline" size={24} color={color} />}
          onPress={() => router.push('/(drawer)/home' as any)}
        />

        {/* เมนู Marketplace */}
        <DrawerItem
          label="ซื้อชีทสรุป"
          focused={focusedRouteName === 'marketplace'} // เช็คว่าตรงกับชื่อไฟล์ marketplace.tsx ไหม
          activeTintColor={THEME_COLOR}
          activeBackgroundColor="#EEF2FF"
          icon={({ color }) => <Ionicons name="bag-handle-outline" size={24} color={color} />}
          onPress={() => router.push('/(drawer)/marketplace' as any)}
        />

        <View style={styles.divider} />
        <Text style={styles.menuGroupTitle}>ตัวช่วยพิเศษ</Text>

        <DrawerItem
          label="สิ่งที่ฉันอยากได้"
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
          onPress={() => router.replace('/' as any)}
        />
      </DrawerContentScrollView>

      <DrawerItem
        label="ตะกร้าสินค้า"
        // เช็ค focused โดยดูว่า path ปัจจุบันคือ /cart หรือไม่
        focused={focusedRouteName === 'cart'}
        activeTintColor={THEME_COLOR}
        activeBackgroundColor="#EEF2FF"
        icon={({ color }) => <Ionicons name="cart-outline" size={24} color={color} />}
        // ✅ แก้ไขตรงนี้: ตัด (drawer) ออก เพราะไฟล์อยู่นอกโฟลเดอร์ drawer แล้ว
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