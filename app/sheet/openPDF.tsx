import * as FileSystem from "expo-file-system/legacy";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { SideChatPanel } from "../../components/SideChatPanel";
import { apiRequest } from "../../utils/api";

const { width } = Dimensions.get("window");

export default function OpenPDFScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showControls = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    if (hideTimeout.current) clearTimeout(hideTimeout.current);

    hideTimeout.current = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, 2500);
  };

  useEffect(() => {
    showControls();
  }, []);

  // 📄 โหลด PDF สำหรับดู
  useEffect(() => {
    const fetchPdf = async () => {
      try {
        if (!id) return;

        const response = await apiRequest(`/products/${id}/open`, {
          method: "GET",
        });

        if (!response.ok) {
          throw new Error("คุณไม่มีสิทธิ์เข้าถึงไฟล์นี้");
        }

        const url = await response.text();
        setPdfUrl(url.trim());
      } catch (err: any) {
        Alert.alert("Error", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPdf();
  }, [id]);

  // 🔐 sanitize ชื่อไฟล์
  const sanitizeFileName = (name: string) => {
    return name
      .replace(/[^a-zA-Z0-9ก-๙\s]/g, "")
      .replace(/\s+/g, "_")
      .trim();
  };

  // ⬇️ ดาวน์โหลดไฟล์
  const handleDownload = async () => {
    try {
      if (!id || downloading) return;

      setDownloading(true);

      const response = await apiRequest(`/products/${id}/download`, {
        method: "GET",
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "ไม่สามารถดาวน์โหลดไฟล์ได้");
      }

      const data = await response.json();
      const url = data.fileUrl;
      const sheetName = data.sheetName;

      if (!url || !sheetName) {
        throw new Error("ข้อมูลไฟล์ไม่ถูกต้อง");
      }

      console.log("Downloading from:", url);
      console.log("Sheet name:", sheetName);

      const safeName = sheetName.replace(/[<>:"/\\|?*]+/g, "");
      const fileName = `${safeName}.pdf`;
      const fileUri = FileSystem.documentDirectory + fileName;

      // ✅ เช็คไฟล์ซ้ำ
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) {
        console.log("File already exists:", fileUri);

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        }
        return;
      }

      // ⬇️ โหลดไฟล์
      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        fileUri
      );

      const result = await downloadResumable.downloadAsync();

      if (!result?.uri) {
        throw new Error("Download failed");
      }

      console.log("File saved to:", result.uri);

      // 📤 เปิด Share Sheet
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(result.uri);
      } else {
        Alert.alert("Downloaded", "ไฟล์ถูกดาวน์โหลดแล้ว");
      }

    } catch (err: any) {
      console.log("Download error:", err);
      Alert.alert("Error", err.message);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!pdfUrl) {
    return (
      <View style={styles.center}>
        <Text>ไม่พบไฟล์ PDF</Text>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={showControls}>
      <View style={{ flex: 1 }}>

        {/* PDF Viewer */}
        <WebView
          source={{ uri: pdfUrl }}
          style={{ flex: 1 }}
          onTouchStart={showControls}
          onTouchMove={showControls}
          onMessage={showControls}
        />

        {/* 🔙 Back */}
        <Animated.View style={[styles.backButton, { opacity: fadeAnim }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: "white" }}>← ย้อนกลับ</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ⬇️ Download */}
        <Animated.View style={[styles.downloadButton, { opacity: fadeAnim }]}>
          <TouchableOpacity onPress={handleDownload} disabled={downloading}>
            {downloading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ color: "white" }}>ดาวน์โหลด</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* 💬 Chat */}
        {!chatOpen && (
          <Animated.View style={[styles.chatButton, { opacity: fadeAnim }]}>
            <TouchableOpacity
              style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
              onPress={() => setChatOpen(true)}
            >
              <Image
                source={{
                  uri: "https://cdn-icons-png.flaticon.com/512/4712/4712035.png",
                }}
                style={styles.chatIcon}
              />
            </TouchableOpacity>
          </Animated.View>
        )}

        {chatOpen && id && (
          <SideChatPanel sheetId={id} onClose={() => setChatOpen(false)} />
        )}

      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 90 : 60,
    left: 20,
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
  },
  downloadButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 90 : 60,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
  },
  chatButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#898888",
    justifyContent: "center",
    alignItems: "center",
    elevation: 15,
  },
  chatIcon: {
    width: 30,
    height: 30,
  },
});