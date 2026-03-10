import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "../../styles/seller-dashboard.styles"; // Import จากไฟล์ที่แยกไว้
import { apiRequest } from "../../utils/api";
import { getUserIdFromSessionToken } from "../../utils/token";

export default function SellerDashboardScreen() {
  const router = useRouter();
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);

  const fetchDashboardData = useCallback(async () => {
    try {
      const userId = await getUserIdFromSessionToken();
      if (!userId) return;
      const response = await apiRequest("/api/payments/seller/dashboard/summary", {
        headers: { "X-USER-ID": userId },
      });
      if (response.ok) {
        const data = await response.json();
        setBalance(data.withdrawableAmount ?? 0);
        setTotalRevenue(data.totalRevenue ?? 0);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoadingBalance(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // TODO: เตรียมดึงข้อมูลรายการล่าสุดจาก Backend
  const recentTransactions: any[] = [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>แดชบอร์ดผู้ขาย</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={20} color="#555" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.pillButton}
            onPress={() => router.replace("/(drawer)/home")}
          >
            <Ionicons name="storefront-outline" size={16} color="#555" />
            <Text style={styles.pillButtonText}>หน้าผู้ซื้อ</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.pillButtonPrimary}
            onPress={() => router.push("/(seller-drawer)/create-sheet")} // แก้ path ให้ตรงกับโครงสร้าง expo-router ของคุณ
          >
            <Ionicons name="add" size={18} color="#7A82FF" />
            <Text style={styles.pillButtonTextPrimary}>ขายชีท</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.summaryContainer}>
          <View style={styles.row}>
            <View style={[styles.card, styles.cardPurple]}>
              <View style={[styles.iconBox, styles.iconBoxWhite]}>
                <Ionicons name="bag-handle-outline" size={20} color="#7A82FF" />
              </View>
              <Text style={styles.cardTitleText}>ยอดขายรวม</Text>
              <Text style={styles.cardValuePurple}>฿{totalRevenue.toLocaleString()}</Text>
            </View>
            <View style={[styles.card, styles.cardWhite]}>
              <View style={[styles.iconBox, styles.iconBoxOutline]}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={20}
                  color="#7A82FF"
                />
              </View>
              <Text style={styles.cardTitleText}>รีวิวใหม่</Text>
              <Text style={styles.cardValuePurple}>0</Text>
            </View>
          </View>

          <View style={[styles.card, styles.cardDark]}>
            <View style={styles.totalBalanceHeader}>
              <View style={styles.iconBoxWhite}>
                <Ionicons name="cash-outline" size={20} color="#7A82FF" />
              </View>
              <TouchableOpacity
                style={styles.withdrawButton}
                onPress={() => router.push("/(seller-drawer)/withdrawal")}
              >
                <Text style={styles.withdrawButtonText}>ถอนเงิน</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.cardTitleWhite}>ยอดเงินทั้งหมด</Text>
            {loadingBalance ? (
              <ActivityIndicator size="small" color="#fff" style={{ alignSelf: "flex-start", marginTop: 4 }} />
            ) : (
              <Text style={styles.cardValueWhite}>
                ฿{balance?.toLocaleString() ?? "0"}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.recentSection}>
          <Text style={styles.recentTitle}>รายการล่าสุด</Text>
          {recentTransactions.length > 0 ? (
            recentTransactions.map((item) => (
              <View key={item.id} style={styles.listItem}>
                <View
                  style={[
                    styles.listIconBox,
                    item.type === "review"
                      ? styles.listIconBoxYellow
                      : styles.listIconBoxPurple,
                  ]}
                >
                  <Ionicons
                    name={
                      item.type === "review"
                        ? "star-outline"
                        : "document-text-outline"
                    }
                    size={20}
                    color={item.type === "review" ? "#F59E0B" : "#7A82FF"}
                  />
                </View>
                <View style={styles.listTextContainer}>
                  <Text style={styles.listTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.listSubtitle} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                </View>
                {item.amount && (
                  <Text style={styles.listAmount}>{item.amount}</Text>
                )}
              </View>
            ))
          ) : (
            <Text style={{ textAlign: "center", color: "#9ca3af", marginTop: 20 }}>
              ยังไม่มีรายการล่าสุด
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
