import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

export const ChatInput = ({ onSend, loading }: { onSend: (msg: string) => void, loading: boolean }) => {
  const [text, setText] = useState('');

  const isSendDisabled = loading || !text.trim(); 

  // ฟังก์ชันช่วยเคลียร์ข้อความก่อนส่ง
  const handleSend = () => {
    if (isSendDisabled) return;
    // เผื่อมีตัวอักษรขึ้นบรรทัดใหม่หลงมา จะถูกแปลงเป็นช่องว่างแทน
    const cleanText = text.replace(/\n/g, ' ').trim();
    onSend(cleanText);
    setText('');
  };

  return (
    <View style={styles.container}>
      <TextInput 
        style={styles.input} 
        value={text} 
        onChangeText={setText} 
        placeholder="ถาม AI เกี่ยวกับชีทนี้..."
        onSubmitEditing={handleSend} // กดปุ่ม Done/Enter บนคีย์บอร์ดให้ส่งข้อความเลย
        // เอา multiline={true} ออก เพื่อให้เป็นช่องพิมพ์แบบบรรทัดเดียว
      />
      <TouchableOpacity 
        style={[styles.sendButton, isSendDisabled && styles.sendButtonDisabled]} 
        onPress={handleSend} 
        disabled={isSendDisabled}
      >
        <Ionicons 
          name="paper-plane" 
          size={20} 
          color={isSendDisabled ? '#ccc' : 'white'} 
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flexDirection: 'row', 
    padding: 10, 
    borderTopWidth: 1, 
    borderColor: '#eee', 
    alignItems: 'center' 
  },
  input: { 
    flex: 1, 
    height: 40, 
    backgroundColor: '#f9f9f9', 
    borderRadius: 20, 
    paddingHorizontal: 15, 
    marginRight: 10,
    fontSize: 15, 
  },
  sendButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#007AFF', 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#f5f5f5', 
  }
});