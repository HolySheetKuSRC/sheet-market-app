import React, { useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

const aiAvatarUrl = 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png';

interface ChatMessageProps {
  text: string;
  sender: 'user' | 'ai';
  /** When true, reveals text character-by-character (typewriter effect) */
  animate?: boolean;
}

export const ChatMessage = ({ text, sender, animate = false }: ChatMessageProps) => {
  const isAI = sender === 'ai';
  const [displayed, setDisplayed] = useState(animate ? '' : text);
  const indexRef = useRef(0);

  useEffect(() => {
    if (!animate || !isAI) {
      setDisplayed(text);
      return;
    }
    // Typewriter: reveal 2 characters per ~16 ms frame (~60fps)
    indexRef.current = 0;
    setDisplayed('');
    const id = setInterval(() => {
      indexRef.current += 2;
      if (indexRef.current >= text.length) {
        setDisplayed(text);
        clearInterval(id);
      } else {
        setDisplayed(text.slice(0, indexRef.current));
      }
    }, 16);
    return () => clearInterval(id);
  }, [text, animate, isAI]);

  return (
    <View style={[styles.messageRow, isAI ? styles.aiRow : styles.userRow]}>
      {isAI && (
        <Image source={{ uri: aiAvatarUrl }} style={styles.avatar} />
      )}
      <View style={[styles.bubble, isAI ? styles.aiBubble : styles.userBubble]}>
        <Text style={isAI ? styles.aiText : styles.userText}>{displayed}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  messageRow: {
    flexDirection: 'row',
    marginVertical: 8,
    alignItems: 'flex-start',
    width: '100%',
  },
  aiRow: {
    justifyContent: 'flex-start',
    paddingRight: '15%',
  },
  userRow: {
    justifyContent: 'flex-end',
    paddingLeft: '15%',
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
    flexShrink: 1,
  },
  userBubble: {
    backgroundColor: '#3b82f6',
    borderTopRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#E8EAFF',
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