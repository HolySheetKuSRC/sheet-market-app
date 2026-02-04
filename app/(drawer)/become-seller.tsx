import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BecomeSellerScreen = () => {
  const router = useRouter();
  // ✅ ใช้ navigation ตัวนี้จะจัดการเรื่อง "ย้อนกลับ" ได้แม่นยำกว่า router.back() ใน Drawer
  const navigation = useNavigation();
  
  const [shopName, setShopName] = useState('');
  const [description, setDescription] = useState('');
  const [isAgreed, setIsAgreed] = useState(false);

  // ✅ ฟังก์ชันย้อนกลับที่ปรับปรุงแล้ว
  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack(); // ใช้คำสั่ง goBack โดยตรงของ native stack
    } else {
      // ถ้าไม่มีประวัติจริงๆ (เช่น เปิดหน้าคอมมาเครื่องแรก) ให้กลับ home
      router.replace('/(drawer)/home' as any); 
    }
  };

  const handleSubmit = () => {
    if (!shopName || !description) {
      Alert.alert("ขออภัย", "กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    if (!isAgreed) {
      Alert.alert("ยืนยันเงื่อนไข", "กรุณายอมรับเงื่อนไขการเป็นผู้ขาย");
      return;
    }

    Alert.alert(
      "ส่งใบสมัครสำเร็จ!",
      "เราจะตรวจสอบข้อมูลของท่านภายใน 1-3 วันทำการ",
      [{ text: "ตกลง", onPress: () => router.replace('/(drawer)/home' as any) }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={26} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>สมัครเป็นผู้ขาย</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.bannerSection}>
            <View style={styles.iconCircle}>
              <Ionicons name="storefront" size={50} color="#6C63FF" />
            </View>
            <Text style={styles.bannerTitle}>เริ่มต้นการขายกับเรา</Text>
            <Text style={styles.bannerSubtitle}>
              เปลี่ยนชีทสรุปของคุณให้เป็นรายได้ง่ายๆ เพียงกรอกข้อมูลด้านล่าง
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>ชื่อร้านค้าของคุณ</Text>
            <TextInput
              style={styles.input}
              placeholder="ตั้งชื่อร้านให้น่าสนใจ (เช่น สรุปขั้นเทพ By ออม)"
              value={shopName}
              onChangeText={setShopName}
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>คำอธิบายร้านค้า</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="เล่าจุดเด่นของชีทสรุปคุณสั้นๆ เพื่อให้คนซื้อรู้จักคุณมากขึ้น"
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
              textAlignVertical="top"
              placeholderTextColor="#999"
            />

            <TouchableOpacity 
              style={styles.checkboxContainer} 
              onPress={() => setIsAgreed(!isAgreed)}
              activeOpacity={0.8}
            >
              <Ionicons 
                name={isAgreed ? "checkbox" : "square-outline"} 
                size={24} 
                color={isAgreed ? "#6C63FF" : "#999"} 
              />
              <Text style={styles.checkboxLabel}>
                ฉันยอมรับเงื่อนไขและข้อกำหนดในการลงทะเบียนเป็นผู้ขาย
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[
              styles.submitButton, 
              (!isAgreed || !shopName || !description) && styles.disabledButton
            ]} 
            onPress={handleSubmit}
            disabled={!isAgreed || !shopName || !description}
          >
            <Text style={styles.submitButtonText}>ส่งใบสมัคร</Text>
          </TouchableOpacity>
          
          <Text style={styles.footerNote}>
            * การกดปุ่ม "ส่งใบสมัคร" แสดงว่าคุณยินยอมให้ทางทีมงานตรวจสอบข้อมูลเบื้องต้น
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default BecomeSellerScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    paddingTop: 30
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  scrollContent: { padding: 24 },
  bannerSection: { alignItems: 'center', marginBottom: 32 },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  bannerTitle: { fontSize: 24, fontWeight: 'bold', color: '#6C63FF', marginBottom: 8 },
  bannerSubtitle: { fontSize: 14, color: '#777', textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
  form: { marginBottom: 40 },
  label: { fontSize: 16, fontWeight: '600', color: '#444', marginBottom: 8 },
  input: {
    backgroundColor: '#FBFBFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 24,
    color: '#333',
  },
  textArea: { height: 120 },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  checkboxLabel: { marginLeft: 10, fontSize: 14, color: '#666', flex: 1, lineHeight: 20 },
  submitButton: {
    backgroundColor: '#6C63FF',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: { backgroundColor: '#D1D1D1', shadowOpacity: 0 },
  submitButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  footerNote: { marginTop: 20, fontSize: 12, color: '#AAA', textAlign: 'center' }
});