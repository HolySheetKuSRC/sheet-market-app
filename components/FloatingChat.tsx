import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    FlatList,
    Keyboard,
    KeyboardEvent,
    PanResponder,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';
import { sendMessageToAI } from '../utils/chatService';
import { ChatInput } from './chat/ChatInput';
import { ChatMessage } from './chat/ChatMessage';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  animate?: boolean;
  /** Set to true once the typewriter animation has finished — survives re-opens */
  hasFinishedTyping?: boolean;
}

// ── Thinking animation: 3 bouncing dots ────────────────────────────────────
const ThinkingDots = () => {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 140),
          Animated.timing(dot, { toValue: -7, duration: 280, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 280, useNativeDriver: true }),
          Animated.delay(440),
        ])
      )
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, []);

  return (
    <View style={thinkStyles.row}>
      <View style={thinkStyles.bubble}>
        {dots.map((dot, i) => (
          <Animated.View
            key={i}
            style={[thinkStyles.dot, { transform: [{ translateY: dot }] }]}
          />
        ))}
      </View>
    </View>
  );
};

const thinkStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 6,
    alignItems: 'flex-end',
  },
  bubble: {
    flexDirection: 'row',
    backgroundColor: '#E8EAFF',
    borderRadius: 18,
    borderTopLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#6366F1',
    marginHorizontal: 3,
  },
});

// ── Empty state placeholder ─────────────────────────────────────────────────
const EmptyState = () => (
  <View style={{ alignItems: 'center', paddingTop: 50, paddingHorizontal: 28 }}>
    <Text style={{ fontSize: 36 }}>✦</Text>
    <Text style={{ fontSize: 17, fontWeight: '700', color: '#1E293B', marginTop: 14, textAlign: 'center' }}>
      AI ติวเตอร์พร้อมช่วยคุณ
    </Text>
    <Text style={{ color: '#64748B', textAlign: 'center', marginTop: 8, lineHeight: 22, fontSize: 14 }}>
      ถามได้ทุกเรื่องเกี่ยวกับบทเรียน{'\n'}ชีทสรุป หรือข้อสอบเก่า
    </Text>
  </View>
);

export const FloatingChat = () => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isTablet = screenWidth >= 768;

  const [visible, setVisible] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(() => Math.random().toString(36).substring(2, 10));
  const [kbHeight, setKbHeight] = useState(0);

  const resetChat = () => {
    setMessages([]);
    setSessionId(Math.random().toString(36).substring(2, 10));
  };

  // Keyboard height tracking — reliable for absolute/floating panels on iOS & Android
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = (e: KeyboardEvent) => setKbHeight(e.endCoordinates.height);
    const onHide = () => setKbHeight(0);
    const sub1 = Keyboard.addListener(showEvent, onShow);
    const sub2 = Keyboard.addListener(hideEvent, onHide);
    return () => { sub1.remove(); sub2.remove(); };
  }, []);

  const flatListRef = useRef<FlatList>(null);

  // Panel width (tablet only — draggable)
  const defaultPanelW = isTablet ? Math.round(screenWidth * 0.36) : screenWidth;
  const [panelWidth, setPanelWidth] = useState(defaultPanelW);
  const panelWidthSnapshot = useRef(defaultPanelW);
  const isTabletRef = useRef(isTablet);
  const screenWidthRef = useRef(screenWidth);

  // Keep refs in sync
  useEffect(() => { isTabletRef.current = isTablet; }, [isTablet]);
  useEffect(() => { screenWidthRef.current = screenWidth; }, [screenWidth]);
  useEffect(() => {
    const w = isTablet ? Math.round(screenWidth * 0.36) : screenWidth;
    setPanelWidth(w);
    panelWidthSnapshot.current = w;
  }, [isTablet, screenWidth]);

  // Slide-in animation (translateX from right edge)
  const slideAnim = useRef(new Animated.Value(screenWidth)).current;

  // FAB pulsing glow
  const glowScale = useRef(new Animated.Value(1)).current;
  const floatY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowScale, { toValue: 1.12, duration: 1100, useNativeDriver: true }),
        Animated.timing(glowScale, { toValue: 1, duration: 1100, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -5, duration: 1400, useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Drag-to-resize handle (left edge of panel, tablet only)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isTabletRef.current,
      onMoveShouldSetPanResponder: () => isTabletRef.current,
      onPanResponderGrant: () => {
        panelWidthSnapshot.current = panelWidth;
      },
      onPanResponderMove: (_, gs) => {
        if (!isTabletRef.current) return;
        const sw = screenWidthRef.current;
        let newW = panelWidthSnapshot.current - gs.dx;
        if (newW < 280) newW = 280;
        if (newW > sw * 0.65) newW = sw * 0.65;
        setPanelWidth(newW);
      },
    })
  ).current;

  const openChat = () => {
    setVisible(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 58,
      friction: 9,
      useNativeDriver: true,
    }).start();
  };

  const closeChat = () => {
    Animated.timing(slideAnim, {
      toValue: screenWidth,
      duration: 270,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), text, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await sendMessageToAI(sessionId, text, null as any);
      if (res?.message) {
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: res.message,
          sender: 'ai',
          animate: true,
        };
        setMessages(prev => [...prev, aiMsg]);
      }
    } catch (e) {
      console.error('FloatingChat error:', e);
    } finally {
      setLoading(false);
    }
  };

  // Panel geometry
  const panelStyle = isTablet
    ? { width: panelWidth, top: 70, bottom: 16, right: 0 }
    : { width: screenWidth, height: Math.round(screenHeight * 0.80), bottom: 0, right: 0 };

  return (
    <View style={styles.floatingArea} pointerEvents="box-none">

      {/* ── FAB button (hidden while panel is open) ── */}
      {!visible && (
        <Pressable onPress={openChat} style={styles.fabAnchor}>
          <Animated.View style={[styles.fabContainer, { transform: [{ translateY: floatY }] }]}>
            {/* Glow ring — absolutely fills fabContainer */}
            <Animated.View style={[styles.glowRing, { transform: [{ scale: glowScale }] }]} />
            {/* Gradient button — centered inside fabContainer */}
            <LinearGradient
              colors={['#818CF8', '#6366F1', '#A78BFA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.fabGradient}
            >
              <Text style={styles.fabIcon}>✦</Text>
              <Text style={styles.fabLabel}>AI</Text>
            </LinearGradient>
          </Animated.View>
        </Pressable>
      )}

      {/* ── Side panel ── */}
      {visible && (
        <Animated.View
          style={[
            styles.panel,
            panelStyle,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          {/* Drag handle — tablet only */}
          {isTablet && (
            <View {...panResponder.panHandlers} style={styles.dragHandle}>
              <View style={styles.dragPill} />
            </View>
          )}

          {/* Header gradient */}
          <LinearGradient
            colors={['#4F46E5', '#6366F1', '#818CF8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.panelHeader, isTablet && { paddingLeft: 28 }]}
          >
            <View style={styles.headerLeft}>
              <View style={styles.onlineDot} />
              <Text style={styles.panelTitle}>✦  AI ติวเตอร์</Text>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.onlineLabel}>ออนไลน์</Text>
              <TouchableOpacity onPress={resetChat} style={styles.closeBtn}>
                <Ionicons name="refresh" size={15} color="white" />
              </TouchableOpacity>
              <TouchableOpacity onPress={closeChat} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Chat body */}
          <View style={{ flex: 1 }}>
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <ChatMessage
                  id={item.id}
                  text={item.text}
                  sender={item.sender}
                  animate={item.animate === true && !item.hasFinishedTyping}
                  onAnimationComplete={() => {
                    setMessages(prev =>
                      prev.map(m =>
                        m.id === item.id ? { ...m, hasFinishedTyping: true } : m
                      )
                    );
                  }}
                />
              )}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={<EmptyState />}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
              style={{ flex: 1 }}
            />
            {loading && <ThinkingDots />}
            <ChatInput onSend={handleSend} loading={loading} />
            {/* Keyboard spacer: pushes ChatInput above the on-screen keyboard */}
            <View style={{ height: kbHeight }} />
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  floatingArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },

  // ── FAB ────────────────────────────────────────────────────────────────────
  fabAnchor: {
    position: 'absolute',
    bottom: 32,
    right: 20,
  },
  // Fixed-size container — glow ring and gradient button share this space
  fabContainer: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 36,
    borderWidth: 2.5,
    borderColor: 'rgba(99,102,241,0.40)',
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
  },
  fabIcon: {
    color: 'white',
    fontSize: 16,
    lineHeight: 18,
  },
  fabLabel: {
    color: 'white',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // ── Panel ──────────────────────────────────────────────────────────────────
  panel: {
    position: 'absolute',
    backgroundColor: '#F8F9FE',
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    elevation: 40,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 22,
    overflow: 'hidden',
  },
  dragHandle: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 22,
    zIndex: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dragPill: {
    width: 4,
    height: 44,
    borderRadius: 2,
    backgroundColor: 'rgba(99,102,241,0.28)',
  },

  // ── Panel header ───────────────────────────────────────────────────────────
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 15,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
  },
  panelTitle: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  onlineLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
  },

  // ── Chat list ──────────────────────────────────────────────────────────────
  listContent: {
    padding: 16,
    paddingBottom: 8,
    flexGrow: 1,
  },
});