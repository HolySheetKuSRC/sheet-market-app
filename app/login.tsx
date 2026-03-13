import {
  Mitr_400Regular,
  Mitr_500Medium,
  Mitr_600SemiBold,
  useFonts,
} from "@expo-google-fonts/mitr";
import axios from "axios";
import * as Haptics from "expo-haptics";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { saveTokens } from "../utils/token";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const B = {
  primary: "#3E4CD2",
  bg: "#EEEEF8",
  surface: "#FFFFFF",
  textMain: "#292524",
  placeholder: "#D7D8F7",
  link: "#63ADF1",
  border: "#E0E2F5",
  toggleBg: "rgba(62,76,210,0.10)",
} as const;

export default function AuthScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  const [fontsLoaded] = useFonts({
    Mitr_400Regular,
    Mitr_500Medium,
    Mitr_600SemiBold,
  });

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  /* ---------------- EMAIL LOGIN / REGISTER ---------------- */

  const handleAuthAction = async () => {
    if (!email || !password) {
      Toast.show({
        type: "error",
        text1: "กรุณากรอกข้อมูลให้ครบ",
        text2: "อีเมลและรหัสผ่านห้ามว่าง",
      });
      return;
    }

    if (!API_URL) {
      Toast.show({
        type: "error",
        text1: "Config Error",
        text2: "API URL missing",
      });
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        // ── LOGIN ──
        const res = await axios.post(`${API_URL}/auth/login`, { email, password });

        await saveTokens(
          res.data.access_token,
          res.data.refresh_token,
          res.data.session_token
        );

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/(drawer)/home" as any);

      } else {
        // ── REGISTER ──
        if (password !== confirmPassword) {
          Toast.show({
            type: "error",
            text1: "รหัสผ่านไม่ตรงกัน",
            text2: "กรุณาตรวจสอบรหัสผ่านอีกครั้ง",
          });
          return;
        }

        await axios.post(`${API_URL}/auth/register`, {
          username,
          email,
          password,
          secPassword: confirmPassword,
        });

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Toast.show({
          type: "success",
          text1: "สมัครสมาชิกสำเร็จ",
          text2: "กรุณาตรวจสอบ OTP ในอีเมลของคุณ",
          visibilityTime: 4000,
        });

        // Return to login mode and clear inputs
        setIsLogin(true);
        setUsername("");
        setPassword("");
        setConfirmPassword("");
      }

    } catch (error: any) {
      console.error("Auth error:", error);
      const status = error.response?.status;
      let title = "เกิดข้อผิดพลาด";
      let message = error.response?.data?.message ?? "ลองใหม่อีกครั้ง";

      if (status === 401) {
        title = "เข้าสู่ระบบไม่สำเร็จ";
        message = "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
      } else if (status === 403) {
        title = "ยังไม่ได้ยืนยันตัวตน";
        message = "กรุณายืนยัน OTP ก่อนเข้าสู่ระบบ";
      } else if (status === 409) {
        title = "อีเมลนี้ถูกใช้แล้ว";
        message = "กรุณาใช้อีเมลอื่นหรือเข้าสู่ระบบ";
      } else if (!error.response) {
        title = "ไม่สามารถเชื่อมต่อได้";
        message = "กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต";
      }

      Toast.show({
        type: "error",
        text1: title,
        text2: message,
        visibilityTime: 4000,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: B.bg }}>
        <ActivityIndicator size="large" color={B.primary} />
      </View>
    );
  }

  const f = {
    regular: "Mitr_400Regular" as const,
    medium: "Mitr_500Medium" as const,
    semiBold: "Mitr_600SemiBold" as const,
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isLargeScreen && styles.scrollContentLarge,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[
            styles.card,
            isLargeScreen && styles.cardLarge,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}>

            {/* ── Logo ── */}
            <View style={styles.logoRow}>
              <Image
                source={require("../assets/images/icon.png")}
                style={styles.logoImg}
                resizeMode="contain"
              />
              <Text style={[styles.logoText, { fontFamily: f.semiBold }]}>
                GROWTHSHEET
              </Text>
            </View>

            {/* ── Headline ── */}
            <Text style={[styles.title, { fontFamily: f.semiBold }]}>
              {isLogin ? "ยินดีต้อนรับ" : "สร้างบัญชีใหม่"}
            </Text>
            <Text style={[styles.subtitle, { fontFamily: f.regular }]}>
              {isLogin
                ? "เข้าถึงคลังชีทสรุปคุณภาพจากมหาวิทยาลัยชั้นนำของไทย และ ยกระดับการเรียนรู้ด้วยเครื่องมือ AI อัจฉริยะ"
                : "เข้าร่วม GrowthSheet และเริ่มต้นการเรียนรู้ที่ชาญฉลาดยิ่งขึ้น"}
            </Text>

            {/* ── Toggle ── */}
            <View style={styles.toggleWrap}>
              <TouchableOpacity
                style={[styles.toggleTab, isLogin && styles.toggleTabActive]}
                onPress={() => setIsLogin(true)}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleTabText, { fontFamily: f.regular }, isLogin && styles.toggleTabTextActive]}>
                  เข้าสู่ระบบ
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleTab, !isLogin && styles.toggleTabActive]}
                onPress={() => setIsLogin(false)}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleTabText, { fontFamily: f.regular }, !isLogin && styles.toggleTabTextActive]}>
                  สมัครสมาชิก
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── Username (register only) ── */}
            {!isLogin && (
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { fontFamily: f.medium }]}>ชื่อผู้ใช้ (Username)</Text>
                <TextInput
                  placeholder="ชื่อผู้ใช้ของคุณ"
                  style={[styles.input, { fontFamily: f.regular }]}
                  placeholderTextColor={B.placeholder}
                  value={username}
                  onChangeText={setUsername}
                />
              </View>
            )}

            {/* ── Email ── */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { fontFamily: f.medium }]}>อีเมล (Email)</Text>
              <TextInput
                placeholder="อีเมลที่ลงทะเบียนไว้"
                style={[styles.input, { fontFamily: f.regular }]}
                placeholderTextColor={B.placeholder}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* ── Password ── */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { fontFamily: f.medium }]}>รหัสผ่าน (Password)</Text>
              <TextInput
                placeholder="ระบุรหัสผ่านของคุณ"
                style={[styles.input, { fontFamily: f.regular }]}
                placeholderTextColor={B.placeholder}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {/* ── Forgot password (login only) ── */}
            {isLogin && (
              <TouchableOpacity
                style={styles.forgotRow}
                onPress={() => router.push("/forgot-password" as any)}
              >
                <Text style={[styles.forgotText, { fontFamily: f.regular }]}>
                  ลืมรหัสผ่าน?
                </Text>
              </TouchableOpacity>
            )}

            {/* ── Confirm Password (register only) ── */}
            {!isLogin && (
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { fontFamily: f.medium }]}>ยืนยันรหัสผ่าน</Text>
                <TextInput
                  placeholder="ยืนยันรหัสผ่านอีกครั้ง"
                  style={[styles.input, { fontFamily: f.regular }]}
                  placeholderTextColor={B.placeholder}
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>
            )}

            {/* ── Primary CTA ── */}
            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                loading && { opacity: 0.7 },
                { transform: [{ scale: pressed ? 0.96 : 1 }] },
              ]}
              onPress={handleAuthAction}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={B.primary} />
              ) : (
                <Text style={[styles.primaryBtnText, { fontFamily: f.medium }]}>
                  {isLogin ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
                </Text>
              )}
            </Pressable>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ──────────────────────── STYLES ──────────────────────── */

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: B.bg },
  scrollContent: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 36 },
  scrollContentLarge: { alignItems: "center", paddingVertical: 60 },
  card: { width: "100%" },
  cardLarge: {
    maxWidth: 480,
    backgroundColor: B.surface,
    borderRadius: 28,
    paddingHorizontal: 44,
    paddingVertical: 52,
    shadowColor: "#3E4CD2",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.09,
    shadowRadius: 28,
    elevation: 10,
  },
  logoRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 32, gap: 10 },
  logoImg: { width: 38, height: 38, borderRadius: 9 },
  logoText: { fontSize: 14, color: B.primary, letterSpacing: 2 },
  title: { fontSize: 29, color: B.primary, marginBottom: 8 },
  subtitle: { fontSize: 17, color: B.textMain, lineHeight: 27, marginBottom: 28 },
  toggleWrap: { flexDirection: "row", backgroundColor: B.toggleBg, borderRadius: 50, padding: 4, marginBottom: 28, alignSelf: "center" },
  toggleTab: { paddingVertical: 8, paddingHorizontal: 26, borderRadius: 50 },
  toggleTabActive: { backgroundColor: B.primary, shadowColor: B.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.28, shadowRadius: 6, elevation: 4 },
  toggleTabText: { fontSize: 14, color: B.textMain },
  toggleTabTextActive: { color: "#FFFFFF" },
  fieldGroup: { marginBottom: 18 },
  fieldLabel: { fontSize: 17, color: B.textMain, marginBottom: 8 },
  input: {
    backgroundColor: B.surface,
    borderWidth: 1.5,
    borderColor: B.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 14 : 12,
    fontSize: 14,
    color: B.textMain,
    minHeight: 52,
  },
  forgotRow: { alignSelf: "flex-end", marginTop: -6, marginBottom: 24 },
  forgotText: { fontSize: 14, color: B.link },
  primaryBtn: {
    backgroundColor: "#C8CCF2",
    borderWidth: 1.5,
    borderColor: "rgba(62,76,210,0.22)",
    borderRadius: 50,
    minHeight: 52,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 20,
  },
  primaryBtnText: { fontSize: 17, color: B.primary },
});