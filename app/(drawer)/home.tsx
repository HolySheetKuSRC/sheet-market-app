import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

import { useNotification } from './_layout';
import { FloatingChat } from '../../components/FloatingChat';
import { apiRequest } from '@/utils/api';
import { getAccessToken, getUserIdFromSessionToken } from '@/utils/token';


type Notification = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read?: boolean;
};

export default function HomeScreen() {

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

          <View style={styles.statCard}>
            <Text style={styles.statTitle}>ชีทที่ชื่นชอบ</Text>
            <Text style={styles.statCount}>1 รายการ</Text>
            <View style={styles.iconCircleBlue}>
              <Ionicons name="heart" size={20} color="#FFF" />
            </View>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statTitle}>ชีทที่รอรีวิว</Text>
            <Text style={styles.statCount}>1 รายการ</Text>
            <View style={styles.iconCircleOrange}>
              <Ionicons name="star" size={20} color="#FFF" />
            </View>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statTitle}>อัดเสียง AI</Text>
            <Text style={styles.statSub}>พร้อมสรุปให้ด้วย</Text>
            <View style={styles.iconCirclePurple}>
              <Ionicons name="mic" size={20} color="#FFF" />
            </View>
          </View>

        </View>

      </ScrollView>

      <FloatingChat />

    </View>

  );

}

const styles = StyleSheet.create({

  container: { flex: 1, backgroundColor: '#F8FAFC' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    paddingTop: 45,
    paddingBottom: 20,
    justifyContent: 'space-between'
  },

  searchBar: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    padding: 8,
    marginHorizontal: 16,
    alignItems: 'center'
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40
  },

  headerSection: {
    marginBottom: 20
  },

  greetingTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#6C63FF'
  },

  greetingSubtitle: {
    color: '#64748B',
    fontSize: 14
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },

  statCard: {
    width: '31%',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 16,
    elevation: 2,
    height: 120,
    justifyContent: 'space-between'
  },

  statTitle: {
    fontSize: 12,
    fontWeight: 'bold'
  },

  statCount: {
    fontSize: 10,
    color: '#999'
  },

  statSub: {
    fontSize: 10,
    color: '#999'
  },

  iconCircleBlue: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end'
  },

  iconCircleOrange: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFA500',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end'
  },

  iconCirclePurple: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#C084FC',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end'
  },

  notificationBox: {
    position: 'absolute',
    top: 95,
    right: 16,
    width: 260,
    maxHeight: 300,
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 8,
    elevation: 5,
    zIndex: 999,
  },

  notificationItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#EEE',
  },

  unread: {
    backgroundColor: '#EEF2FF'
  },

  notificationTitle: {
    fontWeight: 'bold',
    marginBottom: 4
  },

  notificationTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 4
  },

  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "red",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 18,
    alignItems: "center"
  },

  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold"
  }

});