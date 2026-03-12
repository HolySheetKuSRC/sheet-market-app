import axios from "axios";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const B = {
  primary: "#3E4CD2",
  bg: "#EEEEF8",
  surface: "#FFFFFF",
  textMain: "#292524",
  placeholder: "#D7D8F7",
  link: "#63ADF1",
  border: "#E0E2F5",
} as const;

type Step = 1 | 2 | 3;

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const clearError = () => setErrorMsg("");

  // ── Step 1: ส่ง OTP ──
  const handleSendOtp = async () => {
    clearError();
    if (!email.trim()) {
      setErrorMsg("กรุณาใส่ email");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { email });
      setStep(2);
    } catch (e: any) {
      setErrorMsg(e.response?.data?.message ?? "ไม่พบ email นี้ในระบบ");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: ยืนยัน OTP ──
  const handleVerifyOtp = async () => {
    clearError();
    if (otp.length < 6) {
      setErrorMsg("กรุณาใส่ OTP ให้ครบ 6 หลัก");
      return;
    }
    setStep(3);
  };

  // ── Step 3: Reset Password ──
  const handleResetPassword = async () => {
    clearError();
    if (!newPassword || !confirmPassword) {
      setErrorMsg("กรุณาใส่รหัสผ่านให้ครบ");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("รหัสผ่านไม่ตรงกัน");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/reset-password`, {
        email,
        otp,
        newPassword,
        confirmNewPassword: confirmPassword,
      });
      // สำเร็จ — กลับหน้า login
      router.replace("/");
    } catch (e: any) {
      setErrorMsg(e.response?.data?.message ?? "OTP ไม่ถูกต้องหรือหมดอายุ");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    clearError();
    if (step === 1) router.back();
    else setStep((s) => (s - 1) as Step);
  };

  // ── Step label ──
  const stepTitle = ["ใส่ Email", "ยืนยัน OTP", "ตั้งรหัสใหม่"];
  const stepSubtitle = [
    "ระบุ email ที่ลงทะเบียนไว้ เราจะส่ง OTP ให้",
    `ใส่ OTP 6 หลักที่ส่งไปยัง\n${email}`,
    "ตั้งรหัสผ่านใหม่ของคุณ",
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Back ── */}
          <Pressable onPress={handleBack} style={styles.backBtn}>
            <Text style={styles.backText}>← ย้อนกลับ</Text>
          </Pressable>

          {/* ── Header ── */}
          <Text style={styles.title}>ลืมรหัสผ่าน</Text>
          <Text style={styles.subtitle}>{stepSubtitle[step - 1]}</Text>

          {/* ── Step Indicator ── */}
          <View style={styles.stepRow}>
            {([1, 2, 3] as Step[]).map((s) => (
              <View
                key={s}
                style={[styles.stepDot, step >= s && styles.stepDotActive]}
              />
            ))}
          </View>

          {/* ── Step 1: Email ── */}
          {step === 1 && (
            <>
              <Text style={styles.label}>อีเมล (Email)</Text>
              <TextInput
                style={styles.input}
                placeholder="อีเมลที่ลงทะเบียนไว้"
                placeholderTextColor={B.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={(t) => { setEmail(t); clearError(); }}
              />
              {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}
              <Pressable
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={handleSendOtp}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color={B.primary} />
                  : <Text style={styles.btnText}>ส่ง OTP</Text>}
              </Pressable>
            </>
          )}

          {/* ── Step 2: OTP ── */}
          {step === 2 && (
            <>
              <Text style={styles.label}>รหัส OTP</Text>
              <TextInput
                style={[styles.input, styles.otpInput]}
                placeholder="_ _ _ _ _ _"
                placeholderTextColor={B.placeholder}
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={(t) => { setOtp(t); clearError(); }}
              />
              {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}
              <Pressable style={styles.btn} onPress={handleVerifyOtp}>
                <Text style={styles.btnText}>ยืนยัน OTP</Text>
              </Pressable>
              {/* ส่ง OTP ใหม่ */}
              <Pressable onPress={handleSendOtp} disabled={loading}>
                <Text style={styles.resend}>
                  {loading ? "กำลังส่ง..." : "ส่ง OTP อีกครั้ง"}
                </Text>
              </Pressable>
            </>
          )}

          {/* ── Step 3: New Password ── */}
          {step === 3 && (
            <>
              <Text style={styles.label}>รหัสผ่านใหม่</Text>
              <TextInput
                style={styles.input}
                placeholder="รหัสผ่านใหม่"
                placeholderTextColor={B.placeholder}
                secureTextEntry
                value={newPassword}
                onChangeText={(t) => { setNewPassword(t); clearError(); }}
              />
              <Text style={styles.label}>ยืนยันรหัสผ่านใหม่</Text>
              <TextInput
                style={styles.input}
                placeholder="ยืนยันรหัสผ่านอีกครั้ง"
                placeholderTextColor={B.placeholder}
                secureTextEntry
                value={confirmPassword}
                onChangeText={(t) => { setConfirmPassword(t); clearError(); }}
              />
              {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}
              <Pressable
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color={B.primary} />
                  : <Text style={styles.btnText}>เปลี่ยนรหัสผ่าน</Text>}
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: B.bg },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },

  backBtn: { marginBottom: 24 },
  backText: { fontSize: 15, color: B.link },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: B.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: B.textMain,
    lineHeight: 22,
    marginBottom: 24,
  },

  // Step dots
  stepRow: { flexDirection: "row", gap: 8, marginBottom: 32 },
  stepDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: B.border,
  },
  stepDotActive: { backgroundColor: B.primary },

  label: {
    fontSize: 15,
    fontWeight: "500",
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
    fontSize: 15,
    color: B.textMain,
    marginBottom: 16,
  },
  otpInput: {
    fontSize: 24,
    letterSpacing: 12,
    textAlign: "center",
  },

  error: {
    color: "#EF4444",
    fontSize: 13,
    marginBottom: 12,
    marginTop: -8,
  },

  btn: {
    backgroundColor: B.primary,
    borderRadius: 50,
    minHeight: 52,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 16,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#FFF", fontSize: 16, fontWeight: "600" },

  resend: {
    textAlign: "center",
    color: B.link,
    fontSize: 14,
  },
});