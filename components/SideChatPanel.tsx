import React, { useEffect, useRef, useState } from "react";
import {
    Dimensions,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { sendMessageToAI } from "../utils/chatService";
import { getUserIdFromSessionToken } from "../utils/token";
import { ChatInput } from "./chat/ChatInput";
import { ChatMessage } from "./chat/ChatMessage";

const { width } = Dimensions.get("window");

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
}

interface Props {
  onClose: () => void;
  sheetId: string;
}

export const SideChatPanel = ({ onClose, sheetId }: Props) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);

  /**
   * สร้าง deterministic session id จาก userId + sheetId
   */
  useEffect(() => {
    const initSession = async () => {
      const userId = await getUserIdFromSessionToken();

      if (!userId) {
        console.warn("⚠️ No user id found in session token");
        return;
      }

      const deterministicSession = `${userId}_${sheetId}`;
      setSessionId(deterministicSession);

      console.log("✅ Session ID:", deterministicSession);
    };

    initSession();
  }, [sheetId]);

  const handleSend = async (text: string) => {
    if (!text.trim() || !sessionId) return;

    console.log("📤 Sending message...");
    console.log("Session ID:", sessionId);
    console.log("Sheet ID:", sheetId);

    const userMsg: Message = {
      id: Date.now().toString(),
      text,
      sender: "user",
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await sendMessageToAI(sessionId, text, sheetId);

      if (res?.message) {
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: res.message,
          sender: "ai",
        };

        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (error) {
      console.error("Chat Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
      style={styles.panel}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Assistant</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatMessage text={item.text} sender={item.sender} />
        )}
        contentContainerStyle={styles.listContent}
        style={{ flex: 1 }}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        onLayout={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
      />

      <ChatInput onSend={handleSend} loading={loading || !sessionId} />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  panel: {
    position: "absolute",
    right: 20,
    top: 100,
    bottom: 40,
    width: width * 0.35,
    backgroundColor: "white",
    borderRadius: 24,
    elevation: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#f0f0f0",
  },
  headerTitle: {
    fontWeight: "bold",
    fontSize: 16,
  },
  closeText: {
    fontSize: 18,
    color: "#999",
  },
  listContent: {
    padding: 15,
    paddingBottom: 20,
  },
});