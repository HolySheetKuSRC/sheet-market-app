import { BlurView } from 'expo-blur';
import React, { useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { sendMessageToAI } from '../utils/chatService';
import { ChatInput } from './chat/ChatInput';
import { ChatMessage } from './chat/ChatMessage';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// กำหนดรูปโปรไฟล์ AI (ใช้ในปุ่มลอย)
const aiAvatarUrl = 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
}

export const FloatingChat = () => {
  const [visible, setVisible] = useState(false); 
  const [messages, setMessages] = useState<Message[]>([]); // ข้อมูลจะหายไปเมื่อปิดแอป
  const [loading, setLoading] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // ฟังก์ชันเปิดแชทพร้อมแอนิเมชันสไลด์ขึ้น
  const openChat = () => {
    setVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // ฟังก์ชันปิดแชทพร้อมแอนิเมชันสไลด์ลง
  const closeChat = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    // เพิ่มข้อความฝั่ง User
    const userMsg: Message = { id: Date.now(), text, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      // ยิง API หา AI
      const res = await sendMessageToAI("home_session", text);
      if (res?.message) {
        // เพิ่มข้อความฝั่ง AI
        const aiMsg: Message = { id: Date.now() + 1, text: res.message, sender: 'ai' };
        setMessages(prev => [...prev, aiMsg]);
      }
    } catch (error) {
      console.error("Chat Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.floatingArea}>
      {/* --- ปุ่มกดเปิดแชท (FAB) เปลี่ยนเป็นรูปภาพ --- */}
      <TouchableOpacity style={styles.fab} onPress={openChat} activeOpacity={0.8}>
        <Image source={{ uri: aiAvatarUrl }} style={styles.fabIcon} />
      </TouchableOpacity>

      {/* --- หน้าต่างแชท (Modal) --- */}
      <Modal visible={visible} animationType="none" transparent onRequestClose={closeChat}>
        <BlurView intensity={30} style={styles.modalOverlay}> 
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"} 
            style={styles.keyboardView}
          >
            <Animated.View style={[styles.chatWindow, { transform: [{ translateY: slideAnim }] }]}>
              {/* Header ของหน้าต่างแชท */}
              <View style={styles.header}>
                <View>
                  <Text style={styles.headerTitle}>ถามตอบกับ AI</Text>
                  <Text style={styles.headerStatus}>ออนไลน์</Text>
                </View>
                <TouchableOpacity onPress={closeChat} style={styles.closeArea}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* ส่วนแสดงข้อความ */}
              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => <ChatMessage text={item.text} sender={item.sender} />}
                contentContainerStyle={styles.listContent}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
              />

              {/* ส่วนพิมพ์ข้อความ */}
              <ChatInput onSend={handleSend} loading={loading} />
            </Animated.View>
          </KeyboardAvoidingView>
        </BlurView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingArea: { 
    position: 'absolute', 
    bottom: 25, 
    right: 20, 
    zIndex: 999 
  },
  fab: { 
    backgroundColor: 'white', 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 5,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 3,
    borderWidth: 1, 
    borderColor: '#f0f0f0'
  },
  fabIcon: { 
    width: 42, 
    height: 42, 
    borderRadius: 21 
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.3)' 
  },
  keyboardView: { 
    flex: 1, 
    justifyContent: 'flex-end' 
  },
  chatWindow: { 
    backgroundColor: 'white', 
    height: '75%', 
    borderTopLeftRadius: 25, 
    borderTopRightRadius: 25,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: -3 }, 
    shadowOpacity: 0.1, 
    elevation: 20 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0', 
    alignItems: 'center' 
  },
  headerTitle: { 
    fontWeight: 'bold', 
    fontSize: 18, 
    color: '#333' 
  },
  headerStatus: { 
    fontSize: 12, 
    color: '#4CAF50', 
    marginTop: 2 
  },
  closeArea: { 
    padding: 5 
  },
  closeButton: { 
    fontSize: 22, 
    color: '#ccc', 
    fontWeight: '300' 
  },
  listContent: { 
    paddingHorizontal: 15, 
    paddingVertical: 20, 
    paddingBottom: 30 
  }
});