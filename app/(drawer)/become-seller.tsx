import styles from "@/styles/become-seller.styles";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRouter } from "expo-router";
import React, { ReactNode, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
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

const SellerVerificationScreen = () => {
  const router = useRouter();
  const navigation = useNavigation();

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
    if (Object.values(form).some((v) => !v)) {
      Alert.alert("ข้อมูลไม่ครบ", "กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }

    Alert.alert("ส่งข้อมูลสำเร็จ", "ระบบจะตรวจสอบข้อมูลภายใน 1–3 วันทำการ", [
      { text: "ตกลง", onPress: () => router.replace("/(drawer)/home" as any) },
    ]);
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
        <ScrollView contentContainerStyle={styles.content}>
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

            <UploadBox label="รูปบัตรนักศึกษา" />
            <UploadBox label="รูปนิสิตคู่กับบัตรนักศึกษา" />
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
              placeholder="123-4-56789-0"
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
    </SafeAreaView>
  );
};

export default SellerVerificationScreen;

/* ===== small components ===== */

const Section = ({ title, children }: SectionProps) => (
  <View>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const Label = ({ text }: { text: string }) => (
  <Text style={styles.label}>{text}</Text>
);

import { TextInputProps } from "react-native";

const Input = (props: TextInputProps) => (
  <TextInput {...props} style={styles.input} placeholderTextColor="#B7B7D2" />
);

const UploadBox = ({ label }: { label: string }) => (
  <>
    <Text style={styles.label}>{label}</Text>
    <TouchableOpacity style={styles.uploadBox}>
      <Ionicons name="cloud-upload-outline" size={32} color="#9AA1FF" />
    </TouchableOpacity>
  </>
);
