import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

export const ChatMessage = ({ text, sender }: { text: string, sender: 'user' | 'ai' }) => {
  const isAI = sender === 'ai'; 
  
  const aiAvatarUrl = 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png';

  return (
    <View style={[styles.messageRow, isAI ? styles.aiRow : styles.userRow]}>
      {isAI && (
        <Image 
          source={{ uri: aiAvatarUrl }} 
          style={styles.avatar} 
        />
      )}
      <View style={[styles.bubble, isAI ? styles.aiBubble : styles.userBubble]}>
        <Text style={isAI ? styles.aiText : styles.userText}>{text}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  messageRow: { 
    flexDirection: 'row', 
    marginVertical: 8, 
    alignItems: 'flex-start',
    width: '100%', // ให้แถวใช้พื้นที่เต็ม 100%
  },
  aiRow: { 
    justifyContent: 'flex-start',
    paddingRight: '15%', // เว้นที่ว่างด้านขวา กัน AI ชิดขอบเกินไป
  },
  userRow: { 
    justifyContent: 'flex-end',
    paddingLeft: '15%', // เว้นที่ว่างด้านซ้าย กัน User ชิดขอบเกินไป
  },
  avatar: {
    width: 32, 
    height: 32,
    borderRadius: 16, 
    marginRight: 10,
    marginTop: 2, 
  },
  bubble: { 
    paddingHorizontal: 16,
    paddingVertical: 12, 
    borderRadius: 18,
    flexShrink: 1, // สำคัญมาก: ช่วยให้ข้อความยาวๆ ห่อตัวได้พอดี และข้อความสั้นๆ ไม่ถูกตัดขึ้นบรรทัดใหม่
  },
  userBubble: { 
    backgroundColor: '#3b82f6', 
    borderTopRightRadius: 4, 
  },
  aiBubble: { 
    backgroundColor: '#e2e8f0', 
    borderTopLeftRadius: 4, 
  },
  userText: { 
    color: 'white',
    fontSize: 15,
    lineHeight: 22, 
  },
  aiText: { 
    color: '#1e293b',
    fontSize: 15,
    lineHeight: 22, 
  },
});