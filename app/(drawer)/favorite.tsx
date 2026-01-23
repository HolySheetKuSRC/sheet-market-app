import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function FavoriteScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
           <Ionicons name="menu" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>รายการโปรด</Text>
        <View style={{width: 28}}/>
      </View>
      <View style={styles.center}>
         <Ionicons name="heart-circle-outline" size={80} color="#CCC" />
         <Text style={{color: '#999', marginTop: 10}}>ยังไม่มีรายการที่ชื่นชอบ</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#FFF', paddingTop: 50, alignItems:'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});