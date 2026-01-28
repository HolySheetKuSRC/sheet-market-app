import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    ScrollView,
    StyleSheet, Text,
    TouchableWithoutFeedback,
    View, ViewStyle
} from 'react-native';

const { width, height } = Dimensions.get('window');

export interface NotificationHandle {
  show: () => void;
  hide: () => void;
  isVisible: boolean;
}

const Notification = forwardRef<NotificationHandle>((props, ref) => {
  const [visible, setVisible] = useState(false);
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const showNoti = () => {
    setVisible(true);
    Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  };

  const hideNoti = () => {
    Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setVisible(false));
  };

  useImperativeHandle(ref, () => ({
    isVisible: visible,
    show: showNoti,
    hide: hideNoti,
  }));

  if (!visible) return null;

  return (
    // เลเยอร์พื้นหลังโปร่งใส (Overlay) สำหรับดักการกดที่อื่น
    <View style={styles.overlay}>
      <TouchableWithoutFeedback onPress={hideNoti}>
        <View style={styles.outside} />
      </TouchableWithoutFeedback>

      {/* ตัวกล่องแจ้งเตือน */}
      <Animated.View style={[styles.container, { opacity: opacityAnim } as ViewStyle]}>
        <View style={styles.arrow} />
        <View style={styles.card}>
          <Text style={styles.title}>การแจ้งเตือน</Text>
          <ScrollView style={{ maxHeight: 250 }} showsVerticalScrollIndicator={false}>
            <View style={styles.notiItem}>
              <Text style={styles.notiText}>✅ ซื้อสินค้าสำเร็จแล้ว!</Text>
              <Text style={styles.notiSub}>สรุป Calculus 1 - ฿59</Text>
            </View>
            <View style={[styles.notiItem, { borderBottomWidth: 0 }]}>
              <Text style={styles.notiText}>🎁 โปรโมชั่นใหม่</Text>
              <Text style={styles.notiSub}>ลดราคาชีทสรุปวิชา Com 20%</Text>
            </View>
          </ScrollView>
        </View>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
    zIndex: 9999,
  },
  outside: {
    flex: 1,
    backgroundColor: 'transparent', // หรือใส่เป็น 'rgba(0,0,0,0.1)' ถ้าอยากให้จอมืดลงนิดนึง
  },
  container: {
    position: 'absolute',
    top: 95, 
    right: 16,
    width: 240,
  },
  arrow: {
    width: 0, height: 0,
    borderLeftWidth: 10, borderLeftColor: 'transparent',
    borderRightWidth: 10, borderRightColor: 'transparent',
    borderBottomWidth: 10, borderBottomColor: '#FFF',
    alignSelf: 'flex-end',
    marginRight: 12,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  title: { fontWeight: '900', fontSize: 16, marginBottom: 12, color: '#6C63FF' },
  notiItem: { paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#F0F0F0' },
  notiText: { fontSize: 13, fontWeight: 'bold', color: '#333' },
  notiSub: { fontSize: 11, color: '#999', marginTop: 2 },
});

export default Notification;