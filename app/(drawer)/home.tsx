import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation, useRouter } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
// 1. Import มาจากไฟล์ _layout
import { useNotification } from '../_layout';

export default function HomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  
  // 2. ประกาศเรียกใช้งาน Hook เพื่อดึงฟังก์ชัน notify ออกมา
  const notify = useNotification();

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
          <Ionicons name="menu" size={28} color="#333" />
        </TouchableOpacity>
        <View style={styles.searchBar}>
             <Ionicons name="search" size={20} color="#999" />
             <TextInput placeholder="ค้นหาชื่อวิชา..." style={{flex:1, marginLeft: 10}} />
        </View>
        
        {/* 3. เพิ่ม TouchableOpacity ครอบ Ionicons และใส่ onPress */}
        <TouchableOpacity onPress={() => notify("คุณมีการแจ้งเตือนใหม่! 🔔")}>
            <Ionicons name="notifications-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Greeting */}
        <View style={styles.headerSection}>
          <Text style={styles.greetingTitle}>สวัสดี, ออมมี่!</Text>
          <Text style={styles.greetingSubtitle}>วันนี้คุณพร้อมลุยวิชาไหนดี?</Text>
        </View>

        {/* 3 Menu Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>ชีทที่ชื่นชอบ</Text>
            <Text style={styles.statCount}>1 รายการ</Text>
            <View style={styles.iconCircleBlue}><Ionicons name="heart" size={20} color="#FFF" /></View>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>ชีทที่รอรีวิว</Text>
            <Text style={styles.statCount}>1 รายการ</Text>
            <View style={styles.iconCircleOrange}><Ionicons name="star" size={20} color="#FFF" /></View>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>อัดเสียง AI</Text>
            <Text style={styles.statSub}>พร้อมสรุปให้ด้วย</Text>
            <View style={styles.iconCirclePurple}><Ionicons name="mic" size={20} color="#FFF" /></View>
          </View>
        </View>

        {/* Trending Section */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔥 ชีทสรุปมาแรง</Text>
            <Text style={styles.seeAll}>ดูทั้งหมด {'>'}</Text>
        </View>
        
        {/* Mock Card Horizontal */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
            <TouchableOpacity style={styles.hCard}>
                <Image source={{uri: 'https://via.placeholder.com/150'}} style={styles.hCardImg}/>
                <View style={styles.hCardContent}>
                    <Text style={styles.hCardTitle}>สรุป Calculus 1</Text>
                    <Text style={styles.hCardAuthor}>พี่คนนี้หิวข้าว</Text>
                    <View style={styles.tagRow}>
                        <View style={styles.tag}><Text style={styles.tagText}>Math</Text></View>
                        <Text style={styles.priceText}>฿59</Text>
                    </View>
                </View>
            </TouchableOpacity>
             <TouchableOpacity style={styles.hCard}>
                <Image source={{uri: 'https://via.placeholder.com/150'}} style={styles.hCardImg}/>
                <View style={styles.hCardContent}>
                    <Text style={styles.hCardTitle}>Algorithm Pro</Text>
                    <Text style={styles.hCardAuthor}>DevMaster</Text>
                    <View style={styles.tagRow}>
                        <View style={styles.tag}><Text style={styles.tagText}>Com</Text></View>
                        <Text style={styles.priceText}>฿99</Text>
                    </View>
                </View>
            </TouchableOpacity>
        </ScrollView>

        {/* AI Tutor Chat Section */}
        <View style={styles.chatContainer}>
            <View style={styles.chatHeader}>
                <View style={{flexDirection:'row', alignItems:'center'}}>
                    <View style={styles.aiAvatar}><MaterialCommunityIcons name="robot" size={20} color="#FFF"/></View>
                    <View style={{marginLeft: 10}}>
                        <Text style={{fontWeight:'bold'}}>Ai Tutor</Text>
                        <Text style={{fontSize:10, color:'green'}}>Online</Text>
                    </View>
                </View>
                <Ionicons name="refresh" size={20} color="#999" />
            </View>
            
            <View style={styles.chatBody}>
                <View style={styles.msgRowRight}>
                    <View style={styles.msgBubbleBlue}>
                        <Text style={styles.msgTextWhite}>ใกล้สอบมิดเทอมวิชาแคลแล้ว แนะนำชีทหน่อยครับ</Text>
                    </View>
                </View>
                <View style={styles.msgRowLeft}>
                    <View style={styles.aiAvatarSmall}><MaterialCommunityIcons name="robot" size={14} color="#FFF"/></View>
                    <View style={styles.msgBubbleGray}>
                        <Text style={styles.msgTextBlack}>
                            สู้ๆ นะครับ! ✌️ สำหรับ Calculus 1 ผมคัดตัวท็อปๆ รีวิวดีมาให้ครับ:{"\n\n"}
                            • <Text style={{color:'#6C63FF', fontWeight:'bold'}}>สรุป Calculus 1 (Midterm)</Text> เล่มนี้เน้นสรุปสูตรกระชับครับ
                        </Text>
                    </View>
                </View>
            </View>
            <View style={styles.chatInputRow}>
                <TextInput placeholder="Chat with AI Tutor" style={styles.chatInput} />
                <View style={styles.sendBtn}><Ionicons name="send" size={16} color="#FFF"/></View>
            </View>
        </View>

      </ScrollView>
    </View>
  );
}

// ... styles เหมือนเดิมของคุณ ...
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  topBar: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFF', paddingTop: 45,paddingBottom: 20, justifyContent: 'space-between' },
  searchBar: { flex: 1, flexDirection: 'row', backgroundColor: '#F0F0F0', borderRadius: 20, padding: 8, marginHorizontal: 16, alignItems: 'center' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  headerSection: { marginBottom: 20 },
  greetingTitle: { fontSize: 28, fontWeight: '900', color: '#6C63FF' },
  greetingSubtitle: { color: '#64748B', fontSize: 14 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  statCard: { width: '31%', backgroundColor: '#FFF', padding: 12, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, height: 120, justifyContent: 'space-between' },
  statTitle: { fontSize: 12, fontWeight: 'bold', color: '#333' },
  statCount: { fontSize: 10, color: '#999' },
  statSub: { fontSize: 10, color: '#999' },
  iconCircleBlue: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#6C63FF', justifyContent: 'center', alignItems: 'center', alignSelf: 'flex-end' },
  iconCircleOrange: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFA500', justifyContent: 'center', alignItems: 'center', alignSelf: 'flex-end' },
  iconCirclePurple: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#C084FC', justifyContent: 'center', alignItems: 'center', alignSelf: 'flex-end' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  seeAll: { color: '#6C63FF', fontSize: 12 },
  horizontalList: { marginBottom: 30 },
  hCard: { width: 200, backgroundColor: '#FFF', borderRadius: 12, padding: 10, marginRight: 15, flexDirection: 'row', alignItems: 'center' },
  hCardImg: { width: 60, height: 80, borderRadius: 8, backgroundColor: '#EEE' },
  hCardContent: { marginLeft: 10, flex: 1 },
  hCardTitle: { fontWeight: 'bold', fontSize: 14 },
  hCardAuthor: { fontSize: 10, color: '#666', marginBottom: 5 },
  tagRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tag: { backgroundColor: '#EEF2FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagText: { fontSize: 10, color: '#6C63FF' },
  priceText: { fontWeight: 'bold', color: '#6C63FF' },
  chatContainer: { backgroundColor: '#FFF', borderRadius: 20, padding: 15, borderWidth: 1, borderColor: '#EEE' },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  aiAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#C084FC', justifyContent: 'center', alignItems: 'center' },
  chatBody: { minHeight: 150 },
  msgRowRight: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10 },
  msgBubbleBlue: { backgroundColor: '#6C63FF', padding: 10, borderRadius: 12, borderTopRightRadius: 0, maxWidth: '80%' },
  msgTextWhite: { color: '#FFF', fontSize: 12 },
  msgRowLeft: { flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 10 },
  aiAvatarSmall: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#C084FC', justifyContent: 'center', alignItems: 'center', marginRight: 5 },
  msgBubbleGray: { backgroundColor: '#F1F5F9', padding: 10, borderRadius: 12, borderTopLeftRadius: 0, maxWidth: '80%' },
  msgTextBlack: { color: '#333', fontSize: 12 },
  chatInputRow: { flexDirection: 'row', marginTop: 10, alignItems: 'center' },
  chatInput: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, fontSize: 12, borderWidth: 1, borderColor: '#EEE' },
  sendBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#6C63FF', justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
});