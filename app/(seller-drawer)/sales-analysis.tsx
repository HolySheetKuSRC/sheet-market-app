import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "../../styles/sales-analysis.styles";
import { apiRequest } from "../../utils/api";
import { getUserIdFromSessionToken } from "../../utils/token";

interface SheetPerformance {
    id: number;
    title: string;
    salesVolume: number;
    revenue: number;
}

interface DashboardSummary {
    totalSalesVolume: number;
    totalRevenue: number;
    withdrawableAmount: number;
    sheetPerformances: SheetPerformance[];
}

// Mock Data for Demographics since API doesn't support it yet
const DEMOGRAPHICS_MOCK = [
    { faculty: "วิศวกรรมศาสตร์", percentage: 45, color: "#4CAF50" },
    { faculty: "วิทยาการจัดการ", percentage: 20, color: "#FFCA28" },
    { faculty: "อื่นๆ", percentage: 35, color: "#BDBDBD" },
];

export default function SalesAnalysisScreen() {
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchDashboardSummary = useCallback(async () => {
        try {
            const userId = await getUserIdFromSessionToken();
            if (!userId) return;

            const response = await apiRequest("/payments/seller/dashboard/summary", {
                headers: { "X-USER-ID": userId },
            });

            if (response.ok) {
                const data = await response.json();
                setSummary(data);
            }
        } catch (err) {
            console.error("Error fetching dashboard summary:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardSummary();
    }, [fetchDashboardSummary]);

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
                <ActivityIndicator size="large" color="#6C63FF" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Date Filter Mock */}
                <View style={{ alignItems: "flex-end", marginBottom: 16 }}>
                    <TouchableOpacity style={styles.dateFilterButton}>
                        <Text style={styles.dateFilterText}>7 วันล่าสุด</Text>
                        <Ionicons name="caret-down" size={14} color="#333" />
                    </TouchableOpacity>
                </View>

                {/* 1. Total Sales Chart (ยอดขายรวม) */}
                <View style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                        <Text style={styles.chartTitle}>ยอดขายรวม</Text>
                        <Text style={styles.chartValue}>฿{(summary?.totalRevenue ?? 0).toLocaleString()}</Text>
                    </View>

                    {/* Mock Bar Chart matching design */}
                    <View style={styles.barChartContainer}>
                        {[
                            { day: "Mon", height: "30%" },
                            { day: "Tue", height: "45%" },
                            { day: "Wed", height: "30%" },
                            { day: "Thu", height: "35%" },
                            { day: "Fri", height: "25%" },
                            { day: "Sat", height: "15%" },
                            { day: "Sun", height: "65%" },
                        ].map((item, index) => (
                            <View key={index} style={styles.barColumn}>
                                <View style={styles.barWrapper}>
                                    <View style={[styles.bar, { height: item.height as any }]} />
                                </View>
                                <Text style={styles.barLabel}>{item.day}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Bottom Row Layout */}
                <View style={styles.bottomRow}>

                    {/* 2. Top Sellers (สินค้าขายดี) */}
                    <View style={styles.rankingCard}>
                        <View style={styles.rankingHeader}>
                            <Text style={styles.sectionTitle}>สินค้าขายดี</Text>
                            <Text>🏆</Text>
                        </View>

                        {summary?.sheetPerformances && summary.sheetPerformances.length > 0 ? (
                            summary.sheetPerformances.slice(0, 3).map((item, index) => (
                                <View key={item.id} style={styles.rankingItem}>
                                    <View style={[styles.rankBadgeWrapper, { backgroundColor: index === 0 ? "#E0E0E0" : index === 1 ? "#E0E0E0" : "#E0E0E0" }]}>
                                        <Text style={styles.rankBadgeText}>{index + 1}</Text>
                                    </View>
                                    <View style={styles.rankInfo}>
                                        <Text style={styles.rankTitle} numberOfLines={1}>{item.title}</Text>
                                        <Text style={styles.rankSubtitle}>{item.salesVolume} ฉบับ</Text>
                                    </View>
                                    <Text style={styles.rankValue}>฿{item.revenue.toLocaleString()}</Text>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.emptyText}>ยังไม่มีข้อมูลการขาย</Text>
                        )}
                    </View>

                    {/* 3. Faculty Demographics (ลูกค้ามาจากคณะอะไร) */}
                    <View style={styles.demoCard}>
                        <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>ลูกค้าของคุณมาจากคณะอะไร?</Text>

                        {DEMOGRAPHICS_MOCK.map((item, index) => (
                            <View key={index} style={styles.demoItem}>
                                <View style={styles.demoLabelRow}>
                                    <Text style={styles.demoFaculty}>{item.faculty}</Text>
                                    <Text style={styles.demoPercent}>{item.percentage}%</Text>
                                </View>
                                <View style={styles.progressBarTrack}>
                                    <View
                                        style={[
                                            styles.progressBarFill,
                                            { width: `${item.percentage}%`, backgroundColor: item.color }
                                        ]}
                                    />
                                </View>
                            </View>
                        ))}
                    </View>

                </View>

            </ScrollView>
        </SafeAreaView>
    );
}
