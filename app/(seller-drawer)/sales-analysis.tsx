import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "../../styles/sales-analysis.styles";
import { apiRequest } from "../../utils/api";
import { getUserIdFromSessionToken } from "../../utils/token";

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
    topSheets: SheetPerformance[];
    facultyDistribution: FacultyDistribution[];
}

export default function SalesAnalysisScreen() {
    const [summary, setSummary] = useState<SellerAnalytics | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchAnalytics = useCallback(async () => {
        try {
            const userId = await getUserIdFromSessionToken();
            if (!userId) return;

            const response = await apiRequest("/products/analytics/summary", {
                headers: { "X-USER-ID": userId },
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
    }, []);

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
                        <Text style={styles.chartValue}>
                            {summary?.totalSales ?? 0} ฉบับ
                        </Text>
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

                        {summary?.topSheets && summary.topSheets.length > 0 ? (
                            summary.topSheets.map((item, index) => (
                                <View key={item.sheetId} style={styles.rankingItem}>
                                    <View style={styles.rankBadgeWrapper}>
                                        <Text style={styles.rankBadgeText}>{index + 1}</Text>
                                    </View>

                                    <View style={styles.rankInfo}>
                                        <Text style={styles.rankTitle} numberOfLines={1}>
                                            {item.title}
                                        </Text>
                                        <Text style={styles.rankSubtitle}>
                                            {item.salesVolume} ฉบับ
                                        </Text>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.emptyText}>ยังไม่มีข้อมูลการขาย</Text>
                        )}
                    </View>

                    {/* 3. Faculty Demographics (ลูกค้ามาจากคณะอะไร) */}
                    <View style={styles.demoCard}>
                        <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>ลูกค้าของคุณมาจากคณะอะไร?</Text>

                        {summary?.facultyDistribution?.map((item, index) => {
                            const total =
                                summary.facultyDistribution.reduce((sum, f) => sum + f.count, 0);

                            const percentage =
                                total > 0 ? Math.round((item.count / total) * 100) : 0;

                            return (
                                <View key={index} style={styles.demoItem}>
                                    <View style={styles.demoLabelRow}>
                                        <Text style={styles.demoFaculty}>{item.faculty}</Text>
                                        <Text style={styles.demoPercent}>{percentage}%</Text>
                                    </View>

                                    <View style={styles.progressBarTrack}>
                                        <View
                                            style={[
                                                styles.progressBarFill,
                                                { width: `${percentage}%` }
                                            ]}
                                        />
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