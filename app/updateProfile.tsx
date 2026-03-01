import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import { apiMultipartRequest, apiRequest } from "../utils/api";

export default function UpdateProfile() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [year, setYear] = useState("");
  const [faculty, setFaculty] = useState("");

  const fetchProfile = async () => {
    try {
      const response = await apiRequest("/users/me", { method: "GET" });
      if (response.ok) {
        const data = await response.json();
        setFullName(data.name ?? "");
        setYear(String(data.studentYear ?? ""));
        setFaculty(data.faculty ?? "");
        setPhotoUrl(data.userPhotoUrl ?? null);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("ต้องอนุญาตให้เข้าถึงรูปภาพ");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled) {
      uploadPhoto(result.assets[0].uri);
    }
  };

  const uploadPhoto = async (localUri: string) => {
    try {
      setUploadingPhoto(true);
      const formData = new FormData();
      if (Platform.OS === "web") {
        const response = await fetch(localUri);
        const blob = await response.blob();
        formData.append("image", blob, "profile.jpg");
      } else {
        formData.append("image", {
          uri: localUri,
          type: "image/jpeg",
          name: "profile.jpg",
        } as any);
      }
      const response = await apiMultipartRequest("/users/me/photo", formData, { method: "PUT" });
      if (!response.ok) throw new Error("Upload failed");
      await fetchProfile();
      Alert.alert("สำเร็จ", "อัปโหลดรูปเรียบร้อย");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleUpdate = async () => {
    if (!fullName.trim()) {
      Alert.alert("กรุณากรอกชื่อ");
      return;
    }
    try {
      setSaving(true);
      const response = await apiRequest("/users/me", {
        method: "PUT",
        body: JSON.stringify({
          name: fullName,
          studentYear: Number(year),
          faculty: faculty,
        }),
      });
      if (response.ok) {
        Alert.alert("สำเร็จ", "อัปเดตโปรไฟล์เรียบร้อย", [
          { text: "ตกลง", onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      {/* --- Top Bar อยู่คงที่ ไม่ขยับตามคีย์บอร์ด --- */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
          <Text style={styles.backText}>กลับ</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>แก้ไขโปรไฟล์</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      {/* ✅ ใช้ KeyboardAvoidingView ครอบส่วนที่เหลือของหน้าจอ */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20} // ปรับค่านี้ถ้าคีย์บอร์ดยังบังอยู่นิดหน่อย
      >
        <ScrollView 
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled" // ช่วยให้กดปุ่มบันทึกได้แม้คีย์บอร์ดเปิดอยู่
        >
          {/* Photo Section */}
          <View style={styles.photoSection}>
            <TouchableOpacity onPress={pickImage}>
              {photoUrl ? (
                <Image source={{ uri: photoUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={40} color="#94A3B8" />
                </View>
              )}
            </TouchableOpacity>
            {uploadingPhoto && <ActivityIndicator style={{ marginTop: 10 }} color="#6C63FF" />}
            <Text style={{ marginTop: 10, color: "#6C63FF" }}>แตะเพื่อเปลี่ยนรูปโปรไฟล์</Text>
          </View>

          {/* Form Section */}
          <View style={styles.form}>
            <Text style={styles.label}>ชื่อ - นามสกุล</Text>
            <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />

            <Text style={styles.label}>ชั้นปี</Text>
            <TextInput style={styles.input} value={year} onChangeText={setYear} keyboardType="numeric" />

            <Text style={styles.label}>คณะ</Text>
            <TextInput style={styles.input} value={faculty} onChangeText={setFaculty} />

            <TouchableOpacity style={styles.saveButton} onPress={handleUpdate}>
              {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>บันทึกข้อมูล</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { padding: 20, paddingBottom: 40, flexGrow: 1 },
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
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    width: 60,
  },
  backText: {
    marginLeft: 4,
    fontSize: 16,
    color: "#1E293B",
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
  photoSection: { alignItems: "center", marginBottom: 30 },
  avatar: { width: 110, height: 110, borderRadius: 55 },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },
  form: { marginTop: 10 },
  label: { marginTop: 15, marginBottom: 6 },
  input: {
    backgroundColor: "#FFF",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  saveButton: {
    marginTop: 30,
    backgroundColor: "#6C63FF",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonText: { color: "#FFF", fontWeight: "bold" },
});