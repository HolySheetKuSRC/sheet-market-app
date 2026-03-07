import styles from "@/components/sellerform.styles";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SellerVerificationScreen from "../../components/sellerform"; // Update with correct component path
import { apiRequest } from "../../utils/api"; // สมมติว่ามีฟังก์ชัน GET ปกติ
import { getRefreshToken, saveTokens } from "../../utils/token"; // ฟังก์ชันจัดการ Token

type PageStatus =
  | "LOADING"
  | "APPLY_PAGE"
  | "PENDING_PAGE"
  | "REJECTED_PAGE"
  | "SELLER_PAGE"
  | "NEED_REFRESH";

const SellerStatusManager = () => {
  console.log("📍 Step 1: Component is rendering");

  const [status, setStatus] = useState<PageStatus>("LOADING");
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      console.log(
        "👀 [Focus] เข้าสู่หน้า SellerStatusManager แล้ว! กำลังเช็คสถานะ...",
      );
      checkStatus();
    }, []),
  );

  const checkStatus = async (isRetry = false) => {
    console.log("📍 Step 3: checkStatus function is starting");
    try {
      setStatus("LOADING");
      const res = await apiRequest("/users/page-status", { method: "GET" });
      const statusText = await res.text();

      console.log(`[${new Date().toLocaleTimeString()}] 📊 Seller Status Updated:`, statusText);

      if (statusText === "NEED_REFRESH") {
        if (!isRetry) {
          console.log("🔄 [Refresh] ต้องขอรับ Token ใหม่ตามคำขอ NEED_REFRESH...");
          const currentRefreshToken = await getRefreshToken();

          if (!currentRefreshToken) {
            console.warn("❌ [Refresh] ไม่มี Refresh Token ในเครื่อง");
            setStatus("APPLY_PAGE");
            return;
          }

          // Use raw fetch for refresh so we don't trigger interceptor loops
          const API_URL = process.env.EXPO_PUBLIC_API_URL;
          const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: currentRefreshToken }),
          });

          if (refreshRes.ok) {
            const data = await refreshRes.json();
            const newAccessToken = data.access_token || data.accessToken;
            const newRefreshToken = data.refresh_token || data.refreshToken || currentRefreshToken;

            if (newAccessToken) {
              await saveTokens(newAccessToken, newRefreshToken);
              console.log("✅ [Refresh] สำเร็จ! ยิง checkStatus ซ้ำ...");
              checkStatus(true);
            } else {
              setStatus("APPLY_PAGE");
            }
          } else {
            setStatus("APPLY_PAGE");
          }
          return;
        } else {
          console.error("🚨 [Warning] ร้องขอ Refresh แล้วแต่ยังติด NEED_REFRESH");
          setStatus("APPLY_PAGE");
          return;
        }
      }

      setStatus(statusText as PageStatus);
    } catch (error) {
      console.error(error);
      setStatus("APPLY_PAGE");
    }
  };

  // 1. หน้ากำลังโหลด
  if (status === "LOADING") {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#9AA1FF" />
      </View>
    );
  }

  // 2. ถ้าสถานะคือ APPLY_PAGE ให้แสดง Form ที่คุณทำไว้
  if (status === "APPLY_PAGE") {
    return <SellerVerificationScreen onSubmited={checkStatus} />;
  }

  // 3. ถ้าเป็นสถานะอื่นๆ แสดง UI ตามเงื่อนไข
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF" }} edges={["top"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Ionicons name="arrow-back" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>สถานะการสมัคร</Text>
          <View style={{ width: 28 }} />
        </View>

        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 40,
          }}
        >
          {status === "PENDING_PAGE" && (
            <StatusDisplay
              icon="time-outline"
              title="อยู่ระหว่างการตรวจสอบ"
              description="ระบบกำลังตรวจสอบข้อมูลของคุณ โดยปกติจะใช้เวลา 1-3 วันทำการ"
              color="#FFA500"
            />
          )}

          {status === "REJECTED_PAGE" && (
            <StatusDisplay
              icon="close-circle-outline"
              title="การสมัครถูกปฏิเสธ"
              description="ขออภัย ข้อมูลของคุณไม่ผ่านการอนุมัติ กรุณาตรวจสอบอีเมลหรือติดต่อเจ้าหน้าที่"
              color="#FF4D4D"
              showRetry
              onRetry={() => setStatus("APPLY_PAGE")}
            />
          )}

          {(status === "SELLER_PAGE" || status === "NEED_REFRESH") && (
            <StatusDisplay
              icon="checkmark-circle-outline"
              title="ยืนยันตัวตนสำเร็จ"
              description="ยินดีด้วย! คุณเป็นผู้ขายเรียบร้อยแล้ว"
              color="#4CAF50"
              buttonText="ไปที่หน้า Dashboard"
              onAction={() => {
                console.log("🚀 Switching to Seller Mode...");
                router.replace("../(seller-drawer)/seller-dashboard");
              }}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

// Sub-component สำหรับแสดง UI แต่ละสถานะ
const StatusDisplay = ({
  icon,
  title,
  description,
  color,
  buttonText,
  onAction,
  showRetry,
  onRetry,
}: any) => (
  <View style={{ alignItems: "center", justifyContent: "center" }}>
    <Ionicons name={icon} size={80} color={color} />
    <Text style={[styles.sectionTitle, { marginTop: 20, fontSize: 22 }]}>
      {title}
    </Text>
    <Text
      style={{
        textAlign: "center",
        color: "#666",
        marginTop: 10,
        lineHeight: 22,
      }}
    >
      {description}
    </Text>

    {buttonText && (
      <TouchableOpacity
        style={[styles.submitButton, { marginTop: 30, paddingHorizontal: 40 }]}
        onPress={onAction}
      >
        <Text style={styles.submitText}>{buttonText}</Text>
      </TouchableOpacity>
    )}

    {showRetry && (
      <TouchableOpacity onPress={onRetry} style={{ marginTop: 20 }}>
        <Text style={{ color: "#9AA1FF", fontWeight: "600" }}>
          ลองสมัครใหม่อีกครั้ง
        </Text>
      </TouchableOpacity>
    )}
  </View>
);

export default SellerStatusManager;
