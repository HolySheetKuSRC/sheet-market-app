import {
  Mitr_400Regular,
  Mitr_500Medium,
  Mitr_600SemiBold,
  useFonts,
} from "@expo-google-fonts/mitr";
import { AntDesign } from "@expo/vector-icons";
import axios from "axios";
import * as Haptics from "expo-haptics";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { saveTokens } from "../utils/token";

import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const GOOGLE_CLIENT_ID =
  "657352686440-of813ues4uubhm85i56rp73c7b68ammr.apps.googleusercontent.com";

/* ── Brand palette (matches reference design) ── */
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
  const [googleLoading, setGoogleLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [username, setUsername] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  /* ---------------- GOOGLE AUTH ---------------- */

  // TODO: สร้าง iOS Client ID จาก Google Cloud Console แล้วใส่ที่นี่
  const GOOGLE_IOS_CLIENT_ID = "";

  const isGoogleSupported = Platform.OS !== "ios" || !!GOOGLE_IOS_CLIENT_ID;

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID || GOOGLE_CLIENT_ID, // fallback เพื่อไม่ให้ crash
    scopes: ["profile", "email"],
    responseType: "id_token",
  });

  useEffect(() => {
    if (response?.type === "success") {

      const idToken = response.params?.id_token;

      console.log("ID TOKEN:", idToken);

      if (idToken) {
        handleGoogleBackend(idToken);
      } else {
        Alert.alert("Google login failed");
      }
    }
  }, [response]);

  const handleGoogleBackend = async (idToken: string) => {
    try {
      setGoogleLoading(true);

      const res = await axios.post(`${API_URL}/auth/google-login`, {
        idToken,
      });

      const accessToken = res.data.access_token;
      const refreshToken = res.data.refresh_token;
      const sessionToken = res.data.session_token;

      await saveTokens(accessToken, refreshToken, sessionToken);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      router.replace("/(drawer)/home" as any);
    } catch (error) {
      console.error(error);
      Alert.alert("Google login failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      if (!request) return;

      setGoogleLoading(true);

      const result = await promptAsync({
      });

      console.log("Google result:", result);
    } catch (error) {
      console.error(error);
      Alert.alert("Google login error");
    } finally {
      setGoogleLoading(false);
    }
  };

  /* ---------------- EMAIL LOGIN ---------------- */

  const handleAuthAction = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    if (!API_URL) {
      Alert.alert("Config Error", "API URL missing");
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const res = await axios.post(`${API_URL}/auth/login`, {
          email,
          password,
        });

        const accessToken = res.data.access_token;
        const refreshToken = res.data.refresh_token;
        const sessionToken = res.data.session_token;

        await saveTokens(accessToken, refreshToken, sessionToken);

        router.replace("/(drawer)/home" as any);
      } else {
        if (password !== confirmPassword) {
          Alert.alert("Passwords do not match");
          setLoading(false);
          return;
        }

        await axios.post(`${API_URL}/auth/register`, {
          username,
          email,
          password,
          secPassword: confirmPassword,
        });

        Alert.alert("Success", "Account created");
        setIsLogin(true);
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Connection error. Please try again.";

      Alert.alert("Authentication Failed", message);
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
          <View style={[styles.card, isLargeScreen && styles.cardLarge]}>

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

            {/* ── Login / Register Toggle ── */}
            <View style={styles.toggleWrap}>
              <TouchableOpacity
                style={[styles.toggleTab, isLogin && styles.toggleTabActive]}
                onPress={() => setIsLogin(true)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.toggleTabText,
                    { fontFamily: f.regular },
                    isLogin && styles.toggleTabTextActive,
                  ]}
                >
                  เข้าสู่ระบบ
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleTab, !isLogin && styles.toggleTabActive]}
                onPress={() => setIsLogin(false)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.toggleTabText,
                    { fontFamily: f.regular },
                    !isLogin && styles.toggleTabTextActive,
                  ]}
                >
                  สมัครสมาชิก
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── Username (register only) ── */}
            {!isLogin && (
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { fontFamily: f.medium }]}>
                  ชื่อผู้ใช้ (Username)
                </Text>
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
              <Text style={[styles.fieldLabel, { fontFamily: f.medium }]}>
                อีเมล (Email)
              </Text>
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
              <Text style={[styles.fieldLabel, { fontFamily: f.medium }]}>
                รหัสผ่าน (Password)
              </Text>
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
              <TouchableOpacity style={styles.forgotRow}>
                <Text style={[styles.forgotText, { fontFamily: f.regular }]}>
                  ลืมรหัสผ่าน?
                </Text>
              </TouchableOpacity>
            )}

            {/* ── Confirm Password (register only) ── */}
            {!isLogin && (
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { fontFamily: f.medium }]}>
                  ยืนยันรหัสผ่าน
                </Text>
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
            <TouchableOpacity
              style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
              onPress={handleAuthAction}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={B.primary} />
              ) : (
                <Text style={[styles.primaryBtnText, { fontFamily: f.medium }]}>
                  {isLogin ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
                </Text>
              )}
            </TouchableOpacity>

            {/* ── OR divider ── */}
            {isGoogleSupported && (
              <View style={styles.dividerRow}>
                <View style={styles.divLine} />
                <Text style={[styles.divText, { fontFamily: f.regular }]}>
                  หรือ
                </Text>
                <View style={styles.divLine} />
              </View>
            )}

            {/* ── Google Button ── */}
            {isGoogleSupported && (
              <TouchableOpacity
                style={[
                  styles.googleBtn,
                  (!request || googleLoading) && { opacity: 0.6 },
                ]}
                onPress={handleGoogleLogin}
                disabled={!request || googleLoading}
                activeOpacity={0.85}
              >
                {googleLoading ? (
                  <ActivityIndicator color={B.primary} />
                ) : (
                  <>
                    <AntDesign
                      name="google"
                      size={20}
                      color="#4285F4"
                      style={{ marginRight: 10 }}
                    />
                    <Text style={[styles.googleBtnText, { fontFamily: f.medium }]}>
                      Sign in with Google
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ──────────────────────── STYLES ──────────────────────── */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: B.bg,
  },

  /* Scroll */
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 36,
  },
  scrollContentLarge: {
    alignItems: "center",
    paddingVertical: 60,
  },

  /* Card — transparent on mobile, elevated white on large screens */
  card: {
    width: "100%",
  },
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

  /* Logo */
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
    gap: 10,
  },
  logoImg: {
    width: 38,
    height: 38,
    borderRadius: 9,
  },
  logoText: {
    fontSize: 14,
    color: B.primary,
    letterSpacing: 2,
  },

  /* Headline */
  title: {
    fontSize: 29,
    color: B.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 17,
    color: B.textMain,
    lineHeight: 27,
    marginBottom: 28,
  },

  /* Toggle pill */
  toggleWrap: {
    flexDirection: "row",
    backgroundColor: B.toggleBg,
    borderRadius: 50,
    padding: 4,
    marginBottom: 28,
    alignSelf: "center",
  },
  toggleTab: {
    paddingVertical: 8,
    paddingHorizontal: 26,
    borderRadius: 50,
  },
  toggleTabActive: {
    backgroundColor: B.primary,
    shadowColor: B.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 4,
  },
  toggleTabText: {
    fontSize: 14,
    color: B.textMain,
  },
  toggleTabTextActive: {
    color: "#FFFFFF",
  },

  /* Form fields */
  fieldGroup: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 17,
    color: B.textMain,
    marginBottom: 8,
  },
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

  /* Forgot password */
  forgotRow: {
    alignSelf: "flex-end",
    marginTop: -6,
    marginBottom: 24,
  },
  forgotText: {
    fontSize: 14,
    color: B.link,
  },

  /* Primary CTA button */
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
  primaryBtnText: {
    fontSize: 17,
    color: B.primary,
  },

  /* Divider */
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  divLine: {
    flex: 1,
    height: 1,
    backgroundColor: B.border,
  },
  divText: {
    fontSize: 13,
    color: "#9CA3AF",
  },

  /* Google button */
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: B.surface,
    borderWidth: 1.5,
    borderColor: B.border,
    borderRadius: 50,
    minHeight: 52,
    paddingHorizontal: 20,
  },
  googleBtnText: {
    fontSize: 17,
    color: B.primary,
  },
});