import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { apiRequest } from "../utils/api";
import { getAccessToken } from "../utils/token";

interface ReportModalProps {
    visible: boolean;
    onClose: () => void;
    sheetId: string | null;
    type: "REPORT" | "APPEAL";
    onSuccess?: () => void;
}

export default function ReportModal({
    visible,
    onClose,
    sheetId,
    type,
    onSuccess,
}: ReportModalProps) {
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);

    const title = type === "REPORT" ? "รายงานปัญหา" : "ยื่นเรื่องอุทธรณ์";
    const subtitle =
        type === "REPORT"
            ? "โปรดระบุปัญหาที่คุณพบ เช่น เนื้อหาผิดพลาด, ละเมิดลิขสิทธิ์"
            : "โปรดรอธิบายเหตุผลและรายละเอียดเพื่อยืนยันว่าชีทของคุณถูกต้อง";

    const buttonText = type === "REPORT" ? "ส่งรายงาน" : "ส่งคำร้องอุทธรณ์";

    const handleSubmit = async () => {
        if (!reason.trim()) {
            Alert.alert("แจ้งเตือน", "กรุณาระบุเหตุผล");
            return;
        }
        if (!sheetId) return;

        setLoading(true);
        try {
            const token = await getAccessToken();
            if (!token) {
                Alert.alert("ข้อผิดพลาด", "เซสชั่นหมดอายุ กรุณาเข้าสู่ระบบใหม่");
                setLoading(false);
                return;
            }

            const response = await apiRequest(`/products/${sheetId}/report`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ reason: reason.trim() }),
            });

            if (response.ok) {
                Alert.alert(
                    "สำเร็จ",
                    type === "REPORT"
                        ? "ส่งรายงานเรียบร้อยแล้ว ทีมงานจะตรวจสอบโดยเร็วที่สุด"
                        : "ส่งคำร้องอุทธรณ์เรียบร้อยแล้ว ทีมงานจะติดต่อกลับไป"
                );

                // รอ 2 วินาทีก่อนปิด Modal และล้างข้อมูล
                setTimeout(() => {
                    setReason("");
                    onSuccess?.();
                    onClose();
                }, 2000);

            } else {
                // เพิ่ม await ตรงนี้ เพื่อรอให้ parse json เสร็จก่อน
                const errorData = await response.json().catch(() => null);

                if (response.status === 409) {
                    // ตอนนี้ errorData จะมีค่า message ที่ส่งมาจาก Backend (Java) แล้ว
                    window.alert(errorData?.message || "คุณได้รายงานชีทนี้ไปแล้ว");
                    setReason("");
                    onClose();
                } else {
                    window.alert(errorData?.message || "ไม่สามารถทำรายการได้ในขณะนี้");
                }
            }
        } catch (error) {
            console.error("REPORT ERROR:", error);
            Alert.alert("เกิดข้อผิดพลาด", "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                style={styles.overlay}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.header}>
                        <View style={styles.titleRow}>
                            <Ionicons
                                name={type === "REPORT" ? "warning" : "document-text"}
                                size={24}
                                color={type === "REPORT" ? "#EF4444" : "#F59E0B"}
                            />
                            <Text style={styles.title}>{title}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} disabled={loading}>
                            <Ionicons name="close" size={24} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.subtitle}>{subtitle}</Text>

                    <TextInput
                        style={styles.textInput}
                        placeholder="พิมพ์เหตุผลที่นี่..."
                        multiline
                        numberOfLines={4}
                        value={reason}
                        onChangeText={setReason}
                        textAlignVertical="top"
                        editable={!loading}
                    />

                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={onClose}
                            disabled={loading}
                        >
                            <Text style={styles.cancelText}>ยกเลิก</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.button,
                                type === "REPORT" ? styles.submitReport : styles.submitAppeal,
                                loading && styles.buttonDisabled,
                            ]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.submitText}>{buttonText}</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    modalContainer: {
        backgroundColor: "#fff",
        borderRadius: 16,
        width: "100%",
        maxWidth: 400,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 8,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1E293B",
    },
    subtitle: {
        fontSize: 14,
        color: "#64748B",
        marginBottom: 16,
        lineHeight: 20,
    },
    textInput: {
        backgroundColor: "#F8FAFC",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 12,
        padding: 12,
        fontSize: 15,
        color: "#334155",
        minHeight: 120,
        marginBottom: 20,
    },
    actionRow: {
        flexDirection: "row",
        gap: 12,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    cancelButton: {
        backgroundColor: "#F1F5F9",
    },
    cancelText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#64748B",
    },
    submitReport: {
        backgroundColor: "#EF4444",
    },
    submitAppeal: {
        backgroundColor: "#F59E0B",
    },
    submitText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#fff",
    },
    buttonDisabled: {
        opacity: 0.7,
    },
});