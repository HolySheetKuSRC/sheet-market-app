import { Ionicons } from "@expo/vector-icons";
import { DrawerActions, useFocusEffect } from "@react-navigation/native";
import { useNavigation, useRouter } from "expo-router";
import { jwtDecode } from "jwt-decode";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import Toast from "react-native-toast-message";

// Import ตัวช่วยในการดึงข้อมูล
import { apiRequest } from "../../utils/api";
import { clearTokens, getSessionToken } from "../../utils/token";

// กำหนด Interface ให้ตรงกับข้อมูล
interface User {
    id: string;
    fullName: string;
    year: number;
    faculty: string;
    photoUrl?: string;
    role?: string;
}

export default function ProfileScreen() {
    const router = useRouter();
    const navigation = useNavigation();

    // State สำหรับข้อมูลผู้ใช้
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // State สำหรับ Modal ลบบัญชี
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");
    const [deleteLoading, setDeleteLoading] = useState(false);

    // ฟังก์ชันกดยืนยันลบบัญชีจาก Modal
    const confirmDeleteAccount = async () => {
        if (!deletePassword) {
            Toast.show({ type: "error", text1: "กรุณาใส่รหัสผ่าน" });
            return;
        }

        setDeleteLoading(true);
        try {
            const token = await getSessionToken();
            const decoded = jwtDecode<{ user_id: string }>(token!);
            const userId = decoded.user_id;

            const res = await apiRequest("/auth/delete-account", {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "X-USER-ID": userId,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ password: deletePassword }), 
            });

            if (res.ok) {
                setDeleteModalVisible(false);
                Toast.show({ type: "success", text1: "ลบบัญชีสำเร็จ" });
                await clearTokens();
                router.replace("/login" as any);
            } else {
                const data = await res.json();
                Toast.show({
                    type: "error",
                    text1: "ลบบัญชีไม่สำเร็จ",
                    text2: data?.message ?? "รหัสผ่านไม่ถูกต้อง",
                });
            }
        } catch (e) {
            Toast.show({ type: "error", text1: "เกิดข้อผิดพลาด", text2: "กรุณาลองใหม่" });
        } finally {
            setDeleteLoading(false);
            setDeletePassword("");
        }
    };

    // ฟังก์ชันดึงข้อมูลผู้ใช้
    const fetchUser = useCallback(async () => {
        try {
            const token = await getSessionToken();
            if (!token) {
                setLoading(false);
                return;
            }

            const response = await apiRequest('/users/me', {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setUser({
                    id: data.id,
                    fullName: data.name,
                    year: data.studentYear,
                    faculty: data.faculty ?? "-",
                    photoUrl: data.userPhotoUrl ?? undefined,
                    role: data.role,
                });
            }
        } catch (error) {
            console.error("PROFILE FETCH USER ERROR:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchUser();
        }, [fetchUser])
    );

    return (
        <View style={styles.container}>
            {/* --- Top Bar --- */}
            <View style={styles.topBar}>
                <TouchableOpacity
                    onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                >
                    <Ionicons name="menu" size={26} color="#333" />
                </TouchableOpacity>

                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>โปรไฟล์ของฉัน</Text>
                </View>

                <TouchableOpacity onPress={() => {/* รอใส่ฟังก์ชันตั้งค่า */ }}>
                    <Ionicons name="settings-outline" size={24} color="#6C63FF" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#6C63FF" />
                    <Text style={{ marginTop: 10, color: "#666" }}>กำลังโหลดข้อมูล...</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* --- ส่วนข้อมูลผู้ใช้ --- */}
                    <View style={styles.profileSection}>
                        {user?.photoUrl ? (
                            <Image source={{ uri: user.photoUrl }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#E2E8F0' }]}>
                                <Ionicons name="person" size={40} color="#94A3B8" />
                            </View>
                        )}

                        <Text style={styles.userName}>
                            {user?.fullName ?? "ไม่พบชื่อผู้ใช้"}
                        </Text>

                        {user && (
                            <Text style={styles.userSub}>
                                ปี {user.year} • {user.faculty}
                            </Text>
                        )}

                        <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => router.push("/updateProfile" as any)}
                        >
                            <Text style={styles.editButtonText}>แก้ไขโปรไฟล์</Text>
                        </TouchableOpacity>
                    </View>

                    {/* --- สถิติย่อ --- */}
                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Text style={styles.statNumber}>12</Text>
                            <Text style={styles.statLabel}>ชีทที่มี</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <Text style={styles.statNumber}>8</Text>
                            <Text style={styles.statLabel}>รายการโปรด</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <Text style={styles.statNumber}>3</Text>
                            <Text style={styles.statLabel}>รีวิวของฉัน</Text>
                        </View>
                    </View>

                    {/* --- เมนูการตั้งค่า --- */}
                    <View style={styles.menuContainer}>
                        <Text style={styles.menuSectionTitle}>บัญชีของฉัน</Text>

                        <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/myLibrary" as any)}>
                            <View style={styles.menuItemLeft}>
                                <Ionicons name="library-outline" size={20} color="#6C63FF" />
                                <Text style={styles.menuItemText}>คลังชีทสรุปของฉัน</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#CCC" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/order" as any)}>
                            <View style={styles.menuItemLeft}>
                                <Ionicons name="receipt-outline" size={20} color="#6C63FF" />
                                <Text style={styles.menuItemText}>ประวัติการสั่งซื้อ</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#CCC" />
                        </TouchableOpacity>

                        {/* --- ปุ่มเปิด Modal ลบบัญชี --- */}
                        <TouchableOpacity
                            style={[styles.menuItem, { marginTop: 8 }]}
                            onPress={() => setDeleteModalVisible(true)}
                        >
                            <View style={styles.menuItemLeft}>
                                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                <Text style={[styles.menuItemText, { color: "#EF4444" }]}>
                                    ลบบัญชี
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#CCC" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => router.push("/change-password" as any)}
                        >
                            <View style={styles.menuItemLeft}>
                                <Ionicons name="lock-closed-outline" size={20} color="#6C63FF" />
                                <Text style={styles.menuItemText}>เปลี่ยนรหัสผ่าน</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#CCC" />
                        </TouchableOpacity>

                        {user?.role === "SELLER" && (
                            <>
                                <Text style={styles.menuSectionTitle}>สำหรับนักสร้างสรรค์</Text>
                                <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/(seller-drawer)/seller-dashboard" as any)}>
                                    <View style={styles.menuItemLeft}>
                                        <Ionicons name="storefront-outline" size={20} color="#6C63FF" />
                                        <Text style={styles.menuItemText}>Seller Studio (จัดการร้านค้า)</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={18} color="#CCC" />
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </ScrollView>
            )}

            {/* ── Delete Account Modal ── */}
            <Modal
                visible={deleteModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setDeleteModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>ยืนยันการลบบัญชี</Text>
                        <Text style={styles.modalSubtitle}>
                            กรุณาใส่รหัสผ่านเพื่อยืนยัน{"\n"}การลบบัญชีไม่สามารถกู้คืนได้
                        </Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="รหัสผ่าน"
                            placeholderTextColor="#CBD5E1"
                            secureTextEntry
                            value={deletePassword}
                            onChangeText={setDeletePassword}
                        />
                        <View style={styles.modalBtnRow}>
                            <TouchableOpacity
                                style={styles.modalCancelBtn}
                                onPress={() => {
                                    setDeleteModalVisible(false);
                                    setDeletePassword("");
                                }}
                            >
                                <Text style={styles.modalCancelText}>ยกเลิก</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalDeleteBtn, deleteLoading && { opacity: 0.6 }]}
                                onPress={confirmDeleteAccount}
                                disabled={deleteLoading}
                            >
                                {deleteLoading
                                    ? <ActivityIndicator color="#FFF" size="small" />
                                    : <Text style={styles.modalDeleteText}>ลบบัญชี</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F8FAFC" },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    topBar: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 45,
        paddingBottom: 20,
        backgroundColor: "#FFF",
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
    },
    headerTitleContainer: { flex: 1, alignItems: "center" },
    headerTitle: { fontSize: 16, fontWeight: "bold", color: "#1F2937" },
    scrollContent: { paddingBottom: 40 },
    profileSection: {
        alignItems: "center",
        backgroundColor: "#FFF",
        paddingVertical: 30,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        elevation: 2,
    },
    avatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 12 },
    userName: { fontSize: 20, fontWeight: "bold", color: "#1F2937" },
    userSub: { fontSize: 13, color: "#64748B", marginTop: 4 },
    editButton: { marginTop: 15, paddingVertical: 6, paddingHorizontal: 20, backgroundColor: "#EEF2FF", borderRadius: 20 },
    editButtonText: { color: "#6C63FF", fontSize: 13, fontWeight: "bold" },
    statsRow: { flexDirection: "row", backgroundColor: "#FFF", marginHorizontal: 16, marginTop: 20, paddingVertical: 15, borderRadius: 12, elevation: 2 },
    statBox: { flex: 1, alignItems: "center" },
    statNumber: { fontSize: 16, fontWeight: "bold", color: "#1F2937" },
    statLabel: { fontSize: 11, color: "#64748B", marginTop: 4 },
    statDivider: { width: 1, backgroundColor: "#F1F5F9" },
    menuContainer: { marginTop: 25, paddingHorizontal: 16 },
    menuSectionTitle: { fontSize: 14, fontWeight: "bold", color: "#64748B", marginBottom: 10, marginTop: 15, marginLeft: 4 },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#FFF",
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        elevation: 1,
    },
    menuItemLeft: { flexDirection: "row", alignItems: "center" },
    menuItemText: { fontSize: 14, color: "#1F2937", marginLeft: 12, fontWeight: "500" },
    
    /* --- Modal Styles --- */
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
    },
    modalBox: {
        backgroundColor: "#FFF",
        borderRadius: 20,
        padding: 24,
        width: "100%",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1F2937",
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 14,
        color: "#64748B",
        marginBottom: 20,
        lineHeight: 20,
    },
    modalInput: {
        borderWidth: 1.5,
        borderColor: "#E2E8F0",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        color: "#1F2937",
        marginBottom: 20,
    },
    modalBtnRow: {
        flexDirection: "row",
        gap: 12,
    },
    modalCancelBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 50,
        borderWidth: 1.5,
        borderColor: "#E2E8F0",
        alignItems: "center",
    },
    modalCancelText: {
        fontSize: 15,
        color: "#64748B",
        fontWeight: "500",
    },
    modalDeleteBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 50,
        backgroundColor: "#EF4444",
        alignItems: "center",
    },
    modalDeleteText: {
        fontSize: 15,
        color: "#FFF",
        fontWeight: "600",
    },
});