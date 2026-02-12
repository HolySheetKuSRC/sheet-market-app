import styles from "@/styles/become-seller.styles";
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
import { SafeAreaView } from "react-native-safe-area-context";

interface SellerForm {
  penname: string;
  fullname: string;
  university: string;
  studentId: string;
  phone: string;
  email: string;
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
}

interface UploadBoxProps {
  label: string;
  image: UploadedImage | null;
  onUpload: () => void;
  onRemove: () => void;
  onPreview: () => void;
}

const SellerVerificationScreen = () => {
  const router = useRouter();
  const navigation = useNavigation();

  const [studentCardImage, setStudentCardImage] =
    useState<UploadedImage | null>(null);
  const [selfieImage, setSelfieImage] = useState<UploadedImage | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [form, setForm] = useState<SellerForm>({
    penname: "",
    fullname: "",
    university: "",
    studentId: "",
    phone: "",
    email: "",
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

  const handleSubmit = () => {
    if (
      Object.values(form).some((v) => !v) ||
      !studentCardImage ||
      !selfieImage
    ) {
      Alert.alert("ข้อมูลไม่ครบ", "กรุณากรอกข้อมูลและอัปโหลดรูปให้ครบ");
      return;
    }

    Alert.alert("ส่งข้อมูลสำเร็จ", "ระบบจะตรวจสอบข้อมูลภายใน 1–3 วันทำการ", [
      {
        text: "ตกลง",
        onPress: () => router.replace("/(drawer)/home" as any),
      },
    ]);
  };

  const pickImage = async (type: "studentCard" | "selfie") => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("ต้องอนุญาตเข้าถึงรูปภาพก่อน");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const asset = result.assets[0];

      const imageData: UploadedImage = {
        uri: asset.uri,
        name:
          asset.fileName ??
          asset.uri.split("/").pop() ??
          `image_${Date.now()}.jpg`,
      };

      if (type === "studentCard") {
        setStudentCardImage(imageData);
      } else {
        setSelfieImage(imageData);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
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
              value={form.penname}
              placeholder="ณัฐ สมเหนือ"
              onChangeText={(v) => onChange("penname", v)}
            />

            <Label text="ชื่อ-นามสกุล (ตามบัตรประชาชน)" />
            <Input
              value={form.fullname}
              placeholder="ณัฐดนัย อภิชาติวงศ์"
              onChangeText={(v) => onChange("fullname", v)}
            />

            <Label text="มหาวิทยาลัย" />
            <Input
              value={form.university}
              placeholder="มหาวิทยาลัยเกษตรศาสตร์"
              onChangeText={(v) => onChange("university", v)}
            />

            <Label text="รหัสนักศึกษา" />
            <Input
              value={form.studentId}
              placeholder="6612345678"
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

            <Label text="อีเมล" />
            <Input
              value={form.email}
              placeholder="user@example.com"
              keyboardType="email-address"
              onChangeText={(v) => onChange("email", v)}
            />
          </Section>

          <Section title="ข้อมูลการรับเงิน">
            <Label text="ชื่อธนาคาร" />
            <Input
              value={form.bank}
              placeholder="ธนาคารกสิกรไทย"
              onChangeText={(v) => onChange("bank", v)}
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

      {/* Preview Modal */}
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
            style={{
              position: "absolute",
              top: 50,
              right: 20,
            }}
            onPress={() => setPreviewImage(null)}
          >
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>

          {previewImage && (
            <Image
              source={{ uri: previewImage }}
              style={{
                width: "90%",
                height: "70%",
                borderRadius: 12,
              }}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default SellerVerificationScreen;

/* ===== Small Components ===== */

const Section = ({ title, children }: SectionProps) => (
  <View>
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

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <>
      <Text style={styles.label}>{label}</Text>

      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
        }}
      >
        <TouchableOpacity
          style={styles.uploadBox}
          onPress={!image ? onUpload : onPreview}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
        >
          {!image ? (
            <>
              <Ionicons name="cloud-upload-outline" size={22} color="#9AA1FF" />
              <Text
                style={{
                  marginLeft: 8,
                  color: "#9AA1FF",
                }}
              >
                อัปโหลดรูปภาพ
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="document-outline" size={20} color="#555" />
              <Text
                numberOfLines={1}
                style={{
                  flex: 1,
                  marginLeft: 8,
                  color: "#333",
                }}
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
            </>
          )}
        </TouchableOpacity>
      </Animated.View>
    </>
  );
};
