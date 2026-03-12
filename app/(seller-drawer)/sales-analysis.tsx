import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "../../styles/sales-analysis.styles";
import { apiRequest } from "../../utils/api";
import { getUserIdFromSessionToken } from "../../utils/token";

interface DailySale {
    date: string;
    amount: number;
}

interface SheetPerformance {
    sheetId: string;
    title: string;
    salesVolume: number;
}

interface FacultyDistribution {
    faculty: string;
    count: number;
}

interface SellerAnalytics {
    totalSales: number;
    dailySales: DailySale[];
    topSheets: SheetPerformance[];
    facultyDistribution: FacultyDistribution[];
}

const FACULTY_COLORS = ["#6C63FF", "#FF6B6B", "#4ECDC4", "#FDCB6E", "#A8E6CF", "#45B7D1"];

export default function SalesAnalysisScreen() {
    const [summary, setSummary] = useState<SellerAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState("7d"); // state สำหรับสลับ 7 วัน / 1 เดือน

    const fetchAnalytics = useCallback(async () => {
        try {
            const userId = await getUserIdFromSessionToken();
            if (!userId) return;

            // ส่ง period ไปกับ query string
            const response = await apiRequest(`/products/analytics/summary?period=${period}`, {
                headers: {
                    "X-USER-ID": userId
                }
            });

            if (response.ok) {
                const data = await response.json();
                setSummary(data);
            }
        } catch (err) {
            console.error("Error fetching analytics:", err);
        } finally {
            setLoading(false);
        }
    }, [period]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
                <ActivityIndicator size="large" color="#6C63FF" />
            </View>
        );
    }

    const totalFaculty = summary?.facultyDistribution?.reduce((sum, f) => sum + f.count, 0) ?? 0;
    
    // หาค่าสูงสุดของยอดขายเพื่อนำมาคำนวณความสูงกราฟแบบ Dynamic
    const maxDailyAmount = Math.max(...(summary?.dailySales?.map(d => d.amount) || [0]), 1);

    return (
        <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Filter Header */}
                <View style={{ alignItems: "flex-end", marginBottom: 16 }}>
                    <TouchableOpacity 
                        style={styles.dateFilterButton}
                        onPress={() => setPeriod(prev => prev === "7d" ? "1m" : "7d")}
                    >
                        <Text style={styles.dateFilterText}>
                            {period === "7d" ? "7 วันล่าสุด" : "1 เดือนล่าสุด"}
                        </Text>
                        <Ionicons name="chevron-down" size={14} color="#333" />
                    </TouchableOpacity>
                </View>

                {/* ================== TOTAL SALES CHART ================== */}
                <View style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                        <Text style={styles.chartTitle}>ยอดขายรวมทั้งหมด</Text>
                        <Text style={styles.chartValue}>
                            {summary?.totalSales ?? 0} ฉบับ
                        </Text>
                    </View>

                    <View style={styles.barChartContainer}>
                        {summary?.dailySales?.map((item, i) => {
                            const barHeight = (item.amount / maxDailyAmount) * 100;
                            return (
                                <View key={i} style={styles.barColumn}>
                                    <View style={styles.barWrapper}>
                                        {item.amount > 0 && (
                                            <Text style={styles.barValueLabel}>{item.amount}</Text>
                                        )}
                                        <View
                                            style={[
                                                styles.bar,
                                                { height: `${barHeight}%` }
                                            ]}
                                        />
                                    </View>
                                    <Text style={styles.barLabel} numberOfLines={1}>{item.date}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* ================== BOTTOM CONTENT ================== */}
                <View style={styles.bottomRow}>

                    {/* TOP SHEETS */}
                    <View style={styles.rankingCard}>
                        <View style={styles.rankingHeader}>
                            <Text style={styles.sectionTitle}>สินค้าขายดี</Text>
                            <Text>🏆</Text>
                        </View>

                        {summary?.topSheets && summary.topSheets.length > 0 ? (
                            summary.topSheets.slice(0, 3).map((item, index) => (
                                <View key={item.sheetId} style={styles.rankingItem}>
                                    <View style={styles.rankBadgeWrapper}>
                                        <Text style={styles.rankBadgeText}>{index + 1}</Text>
                                    </View>
                                    <View style={styles.rankInfo}>
                                        <Text style={styles.rankTitle} numberOfLines={1}>{item.title}</Text>
                                        <Text style={styles.rankSubtitle}>{item.salesVolume} ฉบับ</Text>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.emptyText}>ยังไม่มีข้อมูล</Text>
                        )}
                    </View>

                    {/* FACULTY DISTRIBUTION */}
                    <View style={styles.demoCard}>
                        <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>คณะของลูกค้า</Text>
                        {summary?.facultyDistribution?.map((item, index) => {
                            const percentage = totalFaculty > 0 ? Math.round((item.count / totalFaculty) * 100) : 0;
                            const barColor = FACULTY_COLORS[index % FACULTY_COLORS.length];

                            return (
                                <View key={index} style={styles.demoItem}>
                                    <View style={styles.demoLabelRow}>
                                        <Text style={styles.demoFaculty} numberOfLines={1}>{item.faculty}</Text>
                                        <Text style={styles.demoPercent}>{percentage}%</Text>
                                    </View>
                                    <View style={styles.progressBarTrack}>
                                        <View style={[styles.progressBarFill, { width: `${percentage}%`, backgroundColor: barColor }]} />
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}