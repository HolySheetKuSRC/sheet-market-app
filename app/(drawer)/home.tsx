import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { Client } from "@stomp/stompjs";
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import SockJS from "sockjs-client";

import { apiRequest } from '@/utils/api';
import { getProducts } from '@/utils/productApi';
import { getAccessToken, getUserIdFromSessionToken } from '@/utils/token';
import { FloatingChat } from '../../components/FloatingChat';
import SheetCard from '../../components/sheetcard';
import { useNotification } from './_layout';

type Notification = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read?: boolean;
};

// ── Quick-action widget with spring scale micro-interaction ─────────────────
const QuickActionWidget = ({
  label,
  icon,
  gradientColors,
  onPress,
}: {
  label: string;
  icon: string;
  gradientColors: readonly [string, string];
  onPress: () => void;
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.92, useNativeDriver: true, tension: 200, friction: 8 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 8 }).start();

  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} style={styles.widgetWrapper}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient
          colors={gradientColors as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.widget}
        >
          <View style={styles.widgetIconCircle}>
            <Ionicons name={icon as any} size={22} color="white" />
          </View>
          <Text style={styles.widgetLabel}>{label}</Text>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
};

// ── Section header with "see all" link ──────────────────────────────────────
const SectionHeader = ({ title, onSeeAll }: { title: string; onSeeAll: () => void }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <TouchableOpacity onPress={onSeeAll}>
      <Text style={styles.seeAll}>ดูทั้งหมด →</Text>
    </TouchableOpacity>
  </View>
);

export default function HomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const notify = useNotification();
  const { width } = useWindowDimensions();

  const [userName, setUserName] = useState('');
  const [showList, setShowList] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [trendingSheets, setTrendingSheets] = useState<any[]>([]);
  const [newSheets, setNewSheets] = useState<any[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingNew, setLoadingNew] = useState(true);

  const CARD_WIDTH = width >= 768 ? 200 : 165;

  // ── greeting based on local time ──────────────────────────────────────────
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'อรุณสวัสดิ์ ☀️';
    if (h < 17) return 'สวัสดีตอนบ่าย 🌤';
    if (h < 20) return 'สวัสดีตอนเย็น 🌆';
    return 'สวัสดีตอนกลางคืน 🌙';
  })();

  // ── load user name ────────────────────────────────────────────────────────
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await getAccessToken();
        if (!token) return;
        const res = await apiRequest('/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUserName(data.name ?? data.fullName ?? '');
        }
      } catch (e) {
        console.log('loadUser error', e);
      }
    };
    loadUser();
  }, []);

  // ── load trending & new arrivals ─────────────────────────────────────────
  useEffect(() => {
    getProducts({ sort: 'most_popular', size: 5 })
      .then(data => setTrendingSheets(data?.content ?? (Array.isArray(data) ? data : [])))
      .catch(() => {})
      .finally(() => setLoadingTrending(false));

    getProducts({ sort: 'newest', size: 5 })
      .then(data => setNewSheets(data?.content ?? (Array.isArray(data) ? data : [])))
      .catch(() => {})
      .finally(() => setLoadingNew(false));
  }, []);

  // ── load notifications ────────────────────────────────────────────────────
  useEffect(() => {

    const loadNotifications = async () => {
      try {

        const res = await apiRequest("/notifications");

        if (res.ok) {
          const data = await res.json();
          setNotifications(data.content);
        }

      } catch (err) {
        console.log("Load notifications error:", err);
      }
    };

    const loadUnread = async () => {

      try {

        const res = await apiRequest("/notifications/unread-count");

        if (res.ok) {
          const count = await res.json();
          setUnreadCount(count);
        }

      } catch (err) {
        console.log("Unread count error:", err);
      }
    };

    loadNotifications();
    loadUnread();

  }, []);

  // WebSocket realtime
  useEffect(() => {

    let stompClient: Client;

    const connectWebSocket = async () => {

      const token = await getAccessToken();
      const userId = await getUserIdFromSessionToken();

      const socket = new SockJS(
        `${process.env.EXPO_PUBLIC_WEB_SOCKET_URL}/ws`
      );

      stompClient = new Client({

        webSocketFactory: () => socket,
        reconnectDelay: 5000,

        connectHeaders: {
          "X-USER-ID": `${userId}`,
        },

        onConnect: () => {

          console.log("WebSocket Connected");

          stompClient.subscribe("/user/queue/notifications", (message) => {

            const newNotif: Notification = JSON.parse(message.body);

            setNotifications(prev => [newNotif, ...prev]);

            setUnreadCount(prev => prev + 1);

            notify(newNotif.message);

          });

        }

      });

      stompClient.activate();

    };

    connectWebSocket();

    return () => {
      stompClient?.deactivate();
    };

  }, []);

  const markAsRead = async (item: Notification) => {
    try {
      await apiRequest(`/notifications/${item.id}/read`, { method: 'PATCH' });
      setUnreadCount(prev => Math.max(prev - 1, 0));
      setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
    } catch (err) {
      console.log('mark read error', err);
    }
  };

  const handleSearch = () => {
    if (searchText.trim()) {
      router.push({
        pathname: '/marketplace',
        params: { query: searchText.trim() },
      } as any);
    }
  };

  return (
    <View style={styles.container}>

      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
          <Ionicons name="menu" size={28} color="#333" />
        </TouchableOpacity>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput
            placeholder="ค้นหาชื่อวิชา..."
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity onPress={() => setShowList(!showList)}>
          <View>
            <Ionicons name="notifications-outline" size={24} color="#333" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* ── Notification Dropdown ── */}
      {showList && (
        <View style={styles.notificationBox}>
          <ScrollView>
            {notifications.map(item => (
              <TouchableOpacity
                key={item.id}
                style={[styles.notificationItem, !item.read && styles.unread]}
                onPress={async () => {
                  await markAsRead(item);
                  notify(item.message);
                  setShowList(false);
                }}
              >
                <Text style={styles.notificationTitle}>{item.title}</Text>
                <Text>{item.message}</Text>
                <Text style={styles.notificationTime}>{item.createdAt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── Main Scroll ── */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting card */}
        <LinearGradient
          colors={['#EEF2FF', '#F0F9FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.greetingCard}
        >
          <Text style={styles.greetingLabel}>{greeting}</Text>
          <Text style={styles.greetingTitle}>
            {userName ? `${userName}!` : 'ยินดีต้อนรับ!'}
          </Text>
          <Text style={styles.greetingSubtitle}>วันนี้คุณพร้อมลุยวิชาไหนดี?</Text>
        </LinearGradient>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>เมนูด่วน</Text>
        <View style={styles.widgetsRow}>
          <QuickActionWidget
            label="ชีทที่ชื่นชอบ"
            icon="heart"
            gradientColors={['#6366F1', '#818CF8']}
            onPress={() => router.push('/myLibrary' as any)}
          />
          <QuickActionWidget
            label="รอรีวิว"
            icon="star"
            gradientColors={['#F59E0B', '#FCD34D']}
            onPress={() => router.push('/pending-review')}
          />
          <QuickActionWidget
            label="อัดเสียงสรุป"
            icon="mic"
            gradientColors={['#8B5CF6', '#C084FC']}
            onPress={() => router.push('/transcribe')}
          />
        </View>

        {/* Trending Sheets */}
        <SectionHeader
          title="🔥 ชีทสรุปมาแรง"
          onSeeAll={() => router.push('/marketplace' as any)}
        />
        {loadingTrending ? (
          <ActivityIndicator color="#6366F1" style={{ marginVertical: 20 }} />
        ) : (
          <FlatList
            horizontal
            data={trendingSheets}
            keyExtractor={item => item.id?.toString()}
            renderItem={({ item }) => (
              <View style={{ marginRight: 12 }}>
                <SheetCard item={item} cardWidth={CARD_WIDTH} />
              </View>
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 8 }}
            ListEmptyComponent={<Text style={styles.emptyText}>ยังไม่มีข้อมูล</Text>}
          />
        )}

        {/* New Arrivals */}
        <SectionHeader
          title="✨ เพิ่งอัปเดตใหม่"
          onSeeAll={() => router.push('/marketplace' as any)}
        />
        {loadingNew ? (
          <ActivityIndicator color="#6366F1" style={{ marginVertical: 20 }} />
        ) : (
          <FlatList
            horizontal
            data={newSheets}
            keyExtractor={item => item.id?.toString()}
            renderItem={({ item }) => (
              <View style={{ marginRight: 12 }}>
                <SheetCard item={item} cardWidth={CARD_WIDTH} />
              </View>
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 8 }}
            ListEmptyComponent={<Text style={styles.emptyText}>ยังไม่มีข้อมูล</Text>}
          />
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <FloatingChat />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  // ── Top bar ──────────────────────────────────────────────────────────────
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 50,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 25,
    paddingVertical: 9,
    paddingHorizontal: 14,
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1E293B',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 5,
    paddingVertical: 2,
    minWidth: 18,
    alignItems: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  // ── Notifications ─────────────────────────────────────────────────────────
  notificationBox: {
    position: 'absolute',
    top: 95,
    right: 18,
    width: 280,
    maxHeight: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    zIndex: 999,
  },
  notificationItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  unread: { backgroundColor: '#EEF2FF' },
  notificationTitle: { fontWeight: '700', marginBottom: 3, color: '#1E293B' },
  notificationTime: { fontSize: 11, color: '#94A3B8', marginTop: 4 },

  // ── Scroll content ────────────────────────────────────────────────────────
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 50,
  },

  // ── Greeting card ─────────────────────────────────────────────────────────
  greetingCard: {
    borderRadius: 20,
    padding: 22,
    marginBottom: 24,
  },
  greetingLabel: {
    fontSize: 13,
    color: '#6366F1',
    fontWeight: '600',
    marginBottom: 4,
  },
  greetingTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  greetingSubtitle: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 6,
  },

  // ── Sections ──────────────────────────────────────────────────────────────
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 13,
    color: '#6366F1',
    fontWeight: '600',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 13,
    paddingVertical: 12,
  },

  // ── Quick action widgets ──────────────────────────────────────────────────
  widgetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  widgetWrapper: {
    flex: 1,
    marginHorizontal: 4,
  },
  widget: {
    borderRadius: 18,
    padding: 14,
    minHeight: 110,
    justifyContent: 'space-between',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  widgetIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  widgetLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: 'white',
    marginTop: 8,
  },
});