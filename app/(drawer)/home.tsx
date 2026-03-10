import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { Client } from "@stomp/stompjs";
import { useNavigation } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import SockJS from "sockjs-client";

import { apiRequest } from '@/utils/api';
import { getAccessToken, getUserIdFromSessionToken } from '@/utils/token';
import { useRouter } from 'expo-router';
import { FloatingChat } from '../../components/FloatingChat';
import { useNotification } from './_layout';

type Notification = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read?: boolean;
};

export default function HomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const notify = useNotification();

  const [showList, setShowList] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);


  // โหลด notification
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

      await apiRequest(`/notifications/${item.id}/read`, {
        method: "PATCH"
      });

      setUnreadCount(prev => Math.max(prev - 1, 0));

      setNotifications(prev =>
        prev.map(n =>
          n.id === item.id ? { ...n, read: true } : n
        )
      );

    } catch (err) {

      console.log("mark read error", err);

    }

  };

  return (

    <View style={styles.container}>

      {/* Top Bar */}
      <View style={styles.topBar}>

        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <Ionicons name="menu" size={28} color="#333" />
        </TouchableOpacity>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            placeholder="ค้นหาชื่อวิชา..."
            style={{ flex: 1, marginLeft: 10 }}
          />
        </View>

        {/* Notification Icon */}
        <TouchableOpacity
          onPress={() => setShowList(!showList)}
        >

          <View>

            <Ionicons name="notifications-outline" size={24} color="#333" />

            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}

          </View>

        </TouchableOpacity>

      </View>

      {/* Notification Dropdown */}
      {showList && (

        <View style={styles.notificationBox}>

          <ScrollView>

            {notifications.map(item => (

              <TouchableOpacity
                key={item.id}
                style={[
                  styles.notificationItem,
                  !item.read && styles.unread
                ]}
                onPress={async () => {

                  await markAsRead(item);

                  notify(item.message);

                  setShowList(false);

                }}
              >

                <Text style={styles.notificationTitle}>
                  {item.title}
                </Text>

                <Text>{item.message}</Text>

                <Text style={styles.notificationTime}>
                  {item.createdAt}
                </Text>

              </TouchableOpacity>

            ))}

          </ScrollView>

        </View>

      )}

      {/* Main Scroll */}
      <ScrollView contentContainerStyle={styles.scrollContent}>

        <View style={styles.headerSection}>
          <Text style={styles.greetingTitle}>สวัสดี, ออมมี่!</Text>
          <Text style={styles.greetingSubtitle}>
            วันนี้คุณพร้อมลุยวิชาไหนดี?
          </Text>
        </View>

        {/* Cards */}
        <View style={styles.statsRow}>

          <TouchableOpacity
            style={styles.statCard}
            activeOpacity={0.8}
            onPress={() => router.push("/myLibrary" as any)} // ✅ ปลดคอมเมนต์และเปลี่ยน path เป็นหน้า Library
          >
            <Text style={styles.statNumber}>1</Text>
            <Text style={styles.statTitle}>ชีทที่ชื่นชอบ</Text>
            <View style={styles.iconCircleBlue}>
              <Ionicons name="heart" size={22} color="#FFF" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            activeOpacity={0.8}
            onPress={() => router.push("/pending-review")}
          >

            <Text style={styles.statNumber}>1</Text>
            <Text style={styles.statTitle}>รอรีวิว</Text>
            <View style={styles.iconCircleOrange}>
              <Ionicons name="star" size={22} color="#FFF" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            activeOpacity={0.8}
          onPress={() => router.push("/transcribe")}
          >

            <Text style={styles.statNumber}>AI</Text>
            <Text style={styles.statTitle}>อัดเสียงสรุป</Text>
            <View style={styles.iconCirclePurple}>
              <Ionicons name="mic" size={22} color="#FFF" />
            </View>
          </TouchableOpacity>

        </View>

      </ScrollView>

      <FloatingChat />

    </View>

  );

}

const styles = StyleSheet.create({

  container: { flex: 1, backgroundColor: '#F8FAFC' },
  statNumber: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
    marginTop: 4
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 50,
    paddingBottom: 18,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#F1F5F9'
  },

  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginHorizontal: 14
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 50
  },

  headerSection: {
    marginBottom: 24
  },

  greetingTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#6366F1',
    letterSpacing: -0.5
  },

  greetingSubtitle: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 4
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10
  },

  statCard: {
    width: '31%',
    height: 125,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 20,

    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },

    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    justifyContent: 'space-between'
  },

  statTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B'
  },

  statCount: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2
  },

  statSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2
  },

  iconCircleBlue: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end'
  },

  iconCircleOrange: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end'
  },

  iconCirclePurple: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#C084FC',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end'
  },

  notificationBox: {
    position: 'absolute',
    top: 95,
    right: 18,
    width: 270,
    maxHeight: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 6,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },

    elevation: 6,
    zIndex: 999
  },

  notificationItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9'
  },

  unread: {
    backgroundColor: '#EEF2FF'
  },

  notificationTitle: {
    fontWeight: '700',
    marginBottom: 3,
    color: '#1E293B'
  },

  notificationTime: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4
  },

  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#EF4444",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 18,
    alignItems: "center"
  },

  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700"
  },


});