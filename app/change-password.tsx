import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { jwtDecode } from "jwt-decode";
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
import Toast from "react-native-toast-message";
import { apiRequest } from "../utils/api";
import { getSessionToken } from "../utils/token";

export default function ChangePasswordScreen() {
    const router = useRouter();
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChangePassword = async () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            Toast.show({ type: "error", text1: "กรุณากรอกข้อมูลให้ครบ" });
            return;
        }
        if (newPassword !== confirmPassword) {
            Toast.show({ type: "error", text1: "รหัสผ่านใหม่ไม่ตรงกัน" });
            return;
        }

        setLoading(true);
        try {
            const token = await getSessionToken();

            // ดึง user_id จาก session token
            const decoded = jwtDecode<{ user_id: string }>(token!);
            const userId = decoded.user_id;

            const res = await apiRequest("/auth/change-password", {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "X-USER-ID": userId,          // ✅ เพิ่มตรงนี้
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    oldPassword,
                    newPassword,
                    confirmNewPassword: confirmPassword,
                }),
            });

            if (res.ok) {
                Toast.show({
                    type: "success",
                    text1: "เปลี่ยนรหัสผ่านสำเร็จ",
                    visibilityTime: 2000,
                });
                setTimeout(() => router.replace("/(drawer)/profile" as any), 2000);
            } else {
                const data = await res.json();
                Toast.show({
                    type: "error",
                    text1: "เกิดข้อผิดพลาด",
                    text2: data?.message ?? "รหัสผ่านเดิมไม่ถูกต้อง",
                });
            }
        } catch (e) {
            Toast.show({ type: "error", text1: "ไม่สามารถเชื่อมต่อได้" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </Pressable>
                <Text style={styles.headerTitle}>เปลี่ยนรหัสผ่าน</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>รหัสผ่านเดิม</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="ใส่รหัสผ่านเดิม"
                            placeholderTextColor="#CBD5E1"
                            secureTextEntry
                            value={oldPassword}
                            onChangeText={setOldPassword}
                        />
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>รหัสผ่านใหม่</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="ใส่รหัสผ่านใหม่"
                            placeholderTextColor="#CBD5E1"
                            secureTextEntry
                            value={newPassword}
                            onChangeText={setNewPassword}
                        />
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>ยืนยันรหัสผ่านใหม่</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="ยืนยันรหัสผ่านใหม่"
                            placeholderTextColor="#CBD5E1"
                            secureTextEntry
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />
                    </View>

                    <Pressable
                        style={[styles.btn, loading && { opacity: 0.6 }]}
                        onPress={handleChangePassword}
                        disabled={loading}
                    >
                        {loading
                            ? <ActivityIndicator color="#FFF" />
                            : <Text style={styles.btnText}>บันทึก</Text>}
                    </Pressable>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#F8FAFC" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 16,
        backgroundColor: "#FFF",
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
    },
    backBtn: { width: 40 },
    headerTitle: { fontSize: 16, fontWeight: "bold", color: "#1F2937" },
    content: { padding: 24 },
    fieldGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: "500", color: "#374151", marginBottom: 8 },
    input: {
        backgroundColor: "#FFF",
        borderWidth: 1.5,
        borderColor: "#E2E8F0",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: Platform.OS === "ios" ? 14 : 12,
        fontSize: 15,
        color: "#1F2937",
    },
    btn: {
        backgroundColor: "#6C63FF",
        borderRadius: 50,
        minHeight: 52,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 8,
    },
    btnText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
});