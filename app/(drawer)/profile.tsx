import { Ionicons } from "@expo/vector-icons";
import { DrawerActions, useFocusEffect } from "@react-navigation/native";
import { useNavigation, useRouter } from "expo-router";
import React, { useCallback, useState } from "react"; // ✅ เพิ่ม useCallback
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// 1. Import ตัวช่วยในการดึงข้อมูลแบบเดียวกับใน Drawer
import { apiRequest } from "../../utils/api";
import { getSessionToken } from "../../utils/token";

// 2. กำหนด Interface ให้ตรงกับข้อมูล
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

    // 3. สร้าง State สำหรับเก็บข้อมูลและสถานะการโหลด
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // 4. ฟังก์ชันดึงข้อมูลผู้ใช้ (แยกออกมาเป็น useCallback เพื่อให้เรียกใช้ใน useFocusEffect ได้)
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
            setLoading(false); // ปิด loading เสมอเมื่อจบการทำงาน
        }
    }, []);

    // 5. ใช้ useFocusEffect เพื่อให้ Fetch ข้อมูลใหม่ทุกครั้งที่กลับมาหน้านี้
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

            {/* แสดง Loading ขณะรอข้อมูล */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#6C63FF" />
                    <Text style={{ marginTop: 10, color: "#666" }}>กำลังโหลดข้อมูล...</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* --- ส่วนข้อมูลผู้ใช้ (ดึงจาก State user) --- */}
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

                    {/* --- สถิติย่อ (Stats) --- */}
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

                        {/* --- เช็ค Role ก่อนแสดงผล --- */}
                        {user?.role === "SELLER" && (
                            <>
                                <Text style={styles.menuSectionTitle}>สำหรับนักสร้างสรรค์</Text>

                                <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/become-seller" as any)}>
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F8FAFC" },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },

    /* --- Top Bar Styles --- */
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
    headerTitleContainer: {
        flex: 1,
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#1F2937",
    },

    /* --- Profile Content Styles --- */
    scrollContent: {
        paddingBottom: 40,
    },
    profileSection: {
        alignItems: "center",
        backgroundColor: "#FFF",
        paddingVertical: 30,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        shadowColor: "#000",
        shadowOpacity: 0.02,
        shadowRadius: 5,
        elevation: 2,
    },
    avatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: "#E2E8F0",
        marginBottom: 12,
    },
    userName: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#1F2937",
    },
    userSub: {
        fontSize: 13,
        color: "#64748B",
        marginTop: 4,
    },
    editButton: {
        marginTop: 15,
        paddingVertical: 6,
        paddingHorizontal: 20,
        backgroundColor: "#EEF2FF",
        borderRadius: 20,
    },
    editButtonText: {
        color: "#6C63FF",
        fontSize: 13,
        fontWeight: "bold",
    },

    /* --- Stats Styles --- */
    statsRow: {
        flexDirection: "row",
        backgroundColor: "#FFF",
        marginHorizontal: 16,
        marginTop: 20,
        paddingVertical: 15,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOpacity: 0.02,
        shadowRadius: 5,
        elevation: 2,
    },
    statBox: {
        flex: 1,
        alignItems: "center",
    },
    statNumber: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#1F2937",
    },
    statLabel: {
        fontSize: 11,
        color: "#64748B",
        marginTop: 4,
    },
    statDivider: {
        width: 1,
        backgroundColor: "#F1F5F9",
    },

    /* --- Menu List Styles --- */
    menuContainer: {
        marginTop: 25,
        paddingHorizontal: 16,
    },
    menuSectionTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#64748B",
        marginBottom: 10,
        marginTop: 15,
        marginLeft: 4,
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#FFF",
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        shadowColor: "#000",
        shadowOpacity: 0.01,
        shadowRadius: 3,
        elevation: 1,
    },
    menuItemLeft: {
        flexDirection: "row",
        alignItems: "center",
    },
    menuItemText: {
        fontSize: 14,
        color: "#1F2937",
        marginLeft: 12,
        fontWeight: "500",
    },
});