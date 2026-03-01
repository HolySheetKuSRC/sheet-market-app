import styles from "@/components/sellerform.styles";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useNavigation, useRouter } from "expo-router";
import React, { ReactNode, useRef, useState } from "react";
import {
    Alert,
    Animated,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TextInputProps,
    TouchableOpacity,
    View,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { SafeAreaView } from "react-native-safe-area-context";

import { bankData } from "../constants/banks";
import { universityData } from "../constants/universities";

import { apiMultipartRequest, apiRequest } from "../utils/api";
import { getRefreshToken, saveTokens } from "../utils/token";

interface SellerForm {
  nickname: string;
  fullname: string;
  university: string;
  studentId: string;
  phone: string;
  bank: string;
  bankAccount: string;
  bankName: string;
}

interface SectionProps {
  title: string;
  children: ReactNode;
}

interface UploadedImage {
  uri: string;
  name: string;
  type: string; // เพิ่ม type เพื่อความชัดเจนในการส่ง API
}

interface UploadBoxProps {
  label: string;
  image: UploadedImage | null;
  onUpload: () => void;
  onRemove: () => void;
  onPreview: () => void;
}

const SellerVerificationScreen = ({
  onSubmited,
}: {
  onSubmited?: () => void;
}) => {
  const router = useRouter();
  const navigation = useNavigation();

  const [isUniversityFocus, setIsUniversityFocus] = useState(false);
  const [isBankFocus, setIsBankFocus] = useState(false);

  const [studentCardImage, setStudentCardImage] =
    useState<UploadedImage | null>(null);
  const [selfieImage, setSelfieImage] = useState<UploadedImage | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [form, setForm] = useState<SellerForm>({
    nickname: "",
    fullname: "",
    university: "",
    studentId: "",
    phone: "",
    bank: "",
    bankAccount: "",
    bankName: "",
  });

  const onChange = (key: keyof SellerForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleBack = () => {
    navigation.canGoBack()
      ? navigation.goBack()
      : router.replace("/(drawer)/home" as any);
  };

  const handleSubmit = async () => {
    // 1. ตรวจสอบข้อมูล
    if (
      !form.nickname ||
      !form.fullname ||
      !form.university ||
      !form.studentId ||
      !form.phone ||
      !form.bank ||
      !form.bankAccount ||
      !form.bankName ||
      !studentCardImage ||
      !selfieImage
    ) {
      Alert.alert("ข้อมูลไม่ครบ", "กรุณากรอกข้อมูลและอัปโหลดรูปให้ครบถ้วน");
      return;
    }

    try {
      const fd = new FormData();

      // จัดเตรียม JSON Data
      const payload = {
        nickname: form.nickname,
        fullName: form.fullname,
        university: form.university,
        studentId: form.studentId,
        phone: form.phone,
        bankName: form.bank,
        bankAccountNumber: form.bankAccount,
        bankAccountName: form.bankName,
      };

      fd.append("data", {
        string: JSON.stringify(payload),
        type: "application/json", // พยายามบังคับ type
      } as any);

      // ฟังก์ชันเตรียมไฟล์รูปภาพ
      const appendFile = (key: string, img: UploadedImage) => {
        const uri =
          Platform.OS === "ios" ? img.uri.replace("file://", "") : img.uri;
        fd.append(key, {
          uri: uri,
          name: img.name,
          type: img.type,
        } as any);
      };

      if (studentCardImage) appendFile("studentCardImage", studentCardImage);
      if (selfieImage) appendFile("selfieWithCardImage", selfieImage);

      const res = await apiMultipartRequest("/users/registorSeller", fd, {
        method: "POST",
      });

      if (res.ok) {
        await performRefreshToken();

        Alert.alert(
          "ส่งข้อมูลสำเร็จ",
          "ระบบจะตรวจสอบข้อมูลภายใน 1–3 วันทำการ",
          [
            {
              text: "ตกลง",
              onPress: () => {
                if (onSubmited) {
                  onSubmited?.();
                } else {
                  router.replace("/(drawer)/home" as any);
                }
              },
            },
          ],
        );
      } else {
        const text = await res.text();
        Alert.alert("เกิดข้อผิดพลาด", text || "ไม่สามารถส่งข้อมูลได้");
      }
    } catch (error) {
      console.error("Submit error:", error);
      Alert.alert("เกิดข้อผิดพลาด", "กรุณาลองใหม่อีกครั้ง");
    }
  };

  const performRefreshToken = async () => {
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) return;

      // เรียก API เพื่อขอ Access Token ใหม่
      // หมายเหตุ: ปรับ Endpoint (/auth/refresh) ตามที่ Backend กำหนด
      const response = await apiRequest("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        // บันทึก Token ใหม่ลง SecureStore / localStorage
        // data.accessToken และ data.refreshToken ต้องตรงตามที่ Backend ส่งมา
        await saveTokens(data.accessToken, data.refreshToken);
        console.log("🔄 Tokens refreshed successfully after application");
      }
    } catch (error) {
      console.error("❌ Failed to refresh token:", error);
    }
  };

  const pickImage = async (type: "studentCard" | "selfie") => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("ต้องอนุญาตเข้าถึงรูปภาพก่อน");
      return;
    }

    // แก้ไข: ใช้ค่า 'images' โดยตรงตามข้อกำหนดใหม่ของ SDK 15+
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const asset = result.assets[0];

      // ดึงนามสกุลไฟล์ที่ถูกต้อง
      const fileName =
        asset.fileName ?? asset.uri.split("/").pop() ?? "image.jpg";
      const ext = fileName.split(".").pop()?.toLowerCase();
      const mimeType = ext === "png" ? "image/png" : "image/jpeg";

      const imageData: UploadedImage = {
        uri: asset.uri,
        name: fileName,
        type: mimeType,
      };

      if (type === "studentCard") {
        setStudentCardImage(imageData);
      } else {
        setSelfieImage(imageData);
      }
    }
  };

  // UI Components ส่วนที่เหลือ...
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="arrow-back" size={26} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ยืนยันตัวตนผู้ขาย</Text>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Section title="ข้อมูลผู้ขาย">
            <Label text="นามปากกา" />
            <Input
              value={form.nickname}
              placeholder="ณัฐ สมเหนือ"
              onChangeText={(v) => onChange("nickname", v)}
            />

            <Label text="ชื่อ-นามสกุล (ตามบัตรประชาชน)" />
            <Input
              value={form.fullname}
              placeholder="ณัฐดนัย อภิชาติวงศ์"
              onChangeText={(v) => onChange("fullname", v)}
            />

            <Label text="มหาวิทยาลัย" />
            <Dropdown
              style={[styles.input, styles.dropdown]}
              containerStyle={styles.dropdownContainer}
              placeholderStyle={styles.dropdownPlaceholder}
              selectedTextStyle={styles.dropdownSelectedText}
              inputSearchStyle={styles.dropdownSearchInput}
              iconStyle={styles.dropdownIcon}
              placeholder="เลือกมหาวิทยาลัย"
              data={universityData}
              search
              searchPlaceholder="พิมพ์ชื่อมหาวิทยาลัย..."
              maxHeight={400}
              labelField="label"
              valueField="value"
              value={form.university}
              onFocus={() => setIsUniversityFocus(true)}
              onBlur={() => setIsUniversityFocus(false)}
              onChange={(item) => {
                onChange("university", item.value);
                setIsUniversityFocus(false);
              }}
              renderLeftIcon={() => (
                <Ionicons
                  name="school-outline"
                  size={20}
                  color={form.university ? "#333" : "#B7B7D2"}
                  style={styles.dropdownLeftIcon}
                />
              )}
              renderRightIcon={() => (
                <Ionicons
                  name={isUniversityFocus ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#B7B7D2"
                />
              )}
            />

            <Label text="รหัสนักศึกษา" />
            <Input
              value={form.studentId}
              placeholder="66xxxxxxxx"
              keyboardType="numeric"
              onChangeText={(v) => onChange("studentId", v)}
            />

            <UploadBox
              label="รูปบัตรนักศึกษา"
              image={studentCardImage}
              onUpload={() => pickImage("studentCard")}
              onRemove={() => setStudentCardImage(null)}
              onPreview={() => setPreviewImage(studentCardImage?.uri || null)}
            />

            <UploadBox
              label="รูปนิสิตคู่กับบัตรนักศึกษา"
              image={selfieImage}
              onUpload={() => pickImage("selfie")}
              onRemove={() => setSelfieImage(null)}
              onPreview={() => setPreviewImage(selfieImage?.uri || null)}
            />
          </Section>

          <Section title="ข้อมูลติดต่อ">
            <Label text="หมายเลขโทรศัพท์" />
            <Input
              value={form.phone}
              placeholder="0812345678"
              keyboardType="phone-pad"
              onChangeText={(v) => onChange("phone", v)}
            />
          </Section>

          <Section title="ข้อมูลการรับเงิน">
            <Dropdown
              style={[styles.input, styles.dropdown]}
              containerStyle={styles.dropdownContainer}
              placeholderStyle={styles.dropdownPlaceholder}
              selectedTextStyle={styles.dropdownSelectedText}
              inputSearchStyle={styles.dropdownSearchInput}
              iconStyle={styles.dropdownIcon}
              placeholder="เลือกธนาคาร"
              data={bankData}
              search
              searchPlaceholder="พิมพ์ชื่อธนาคาร..."
              maxHeight={290}
              labelField="label"
              valueField="value"
              value={form.bank}
              onFocus={() => setIsBankFocus(true)}
              onBlur={() => setIsBankFocus(false)}
              onChange={(item) => onChange("bank", item.value)}
              renderLeftIcon={() => (
                <Ionicons
                  name="card-outline"
                  size={20}
                  color={form.bank ? "#333" : "#B7B7D2"}
                  style={styles.dropdownLeftIcon}
                />
              )}
              renderRightIcon={() => (
                <Ionicons
                  name={isBankFocus ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#B7B7D2"
                />
              )}
            />

            <Label text="เลขที่บัญชี" />
            <Input
              value={form.bankAccount}
              placeholder="1234567890"
              keyboardType="numeric"
              onChangeText={(v) => onChange("bankAccount", v)}
            />

            <Label text="ชื่อเจ้าของบัญชี" />
            <Input
              value={form.bankName}
              placeholder="ณัฐดนัย อภิชาติวงศ์"
              onChangeText={(v) => onChange("bankName", v)}
            />
          </Section>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitText}>ส่งข้อมูลเพื่อยืนยันตัวตน</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={!!previewImage} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.8)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            style={{ position: "absolute", top: 50, right: 20 }}
            onPress={() => setPreviewImage(null)}
          >
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>
          {previewImage && (
            <Image
              source={{ uri: previewImage }}
              style={{ width: "90%", height: "70%", borderRadius: 12 }}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

/* ===== Small Components (ใช้ของเดิมที่มีการปรับปรุงเล็กน้อย) ===== */
const Section = ({ title, children }: SectionProps) => (
  <View style={{ marginBottom: 20 }}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const Label = ({ text }: { text: string }) => (
  <Text style={styles.label}>{text}</Text>
);
const Input = (props: TextInputProps) => (
  <TextInput {...props} style={styles.input} placeholderTextColor="#B7B7D2" />
);

const UploadBox = ({
  label,
  image,
  onUpload,
  onRemove,
  onPreview,
}: UploadBoxProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const handlePressIn = () =>
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={styles.uploadBox}
          onPress={!image ? onUpload : onPreview}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
        >
          {!image ? (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="cloud-upload-outline" size={22} color="#9AA1FF" />
              <Text style={{ marginLeft: 8, color: "#9AA1FF" }}>
                อัปโหลดรูปภาพ
              </Text>
            </View>
          ) : (
            <View
              style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
            >
              <Ionicons name="document-outline" size={20} color="#555" />
              <Text
                numberOfLines={1}
                style={{ flex: 1, marginLeft: 8, color: "#333" }}
              >
                {image.name}
              </Text>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
              >
                <Ionicons name="close-circle" size={22} color="red" />
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    </>
  );
};

export default SellerVerificationScreen;
