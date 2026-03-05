import { universityData } from "@/constants/universities_upload";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { styles } from "../../styles/create-sheet.styles";

// ⚠️ สำคัญ: อย่าลืมแก้ไข path นี้ให้ชี้ไปยังไฟล์ api ของคุณ (ไฟล์ที่มี apiMultipartRequest)
import { apiMultipartRequest } from "../../utils/api";

export default function CreateSheetScreen() {
  const router = useRouter();

  // --- States สำหรับ Dropdown ---
  const [isUniDropdownOpen, setIsUniDropdownOpen] = useState(false);
  const [selectedUniLabel, setSelectedUniLabel] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [selectedCategoryLabel, setSelectedCategoryLabel] = useState("");

  const categoryData = [
    { label: "มิดเทอม", value: 1 },
    { label: "ไฟนอล", value: 2 },
    { label: "สรุปรวม", value: 3 },
  ];

  // --- States สำหรับฟอร์ม ---
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    categoryId: "",
    universityId: "",
    courseCode: "",
    courseName: "",
    studyYear: "",
    academicYear: "",
    hashtags: "",
  });

  // --- States สำหรับไฟล์และรูปภาพ ---
  const [pdfFile, setPdfFile] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [previewImages, setPreviewImages] = useState<
    ImagePicker.ImagePickerAsset[]
  >([]);
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Functions การเลือกไฟล์ ---
  const handlePickPDF = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
    });
    if (!result.canceled && result.assets.length > 0) {
      setPdfFile(result.assets[0]);
    }
  };

  const handlePickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true, // เลือกได้หลายรูป
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      // นำรูปใหม่ไปต่อท้ายรูปเดิม
      setPreviewImages([...previewImages, ...result.assets]);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setPreviewImages(
      previewImages.filter((_, index) => index !== indexToRemove),
    );
  };

  // --- Functions จัดการ Dropdown ---
  const selectUniversity = (item: { label: string; value: number }) => {
    setForm({ ...form, universityId: item.value.toString() });
    setSelectedUniLabel(item.label);
    setIsUniDropdownOpen(false);
    setSearchQuery("");
  };

  const selectCategory = (item: { label: string; value: number }) => {
    setForm({ ...form, categoryId: item.value.toString() });
    setSelectedCategoryLabel(item.label);
    setIsCategoryDropdownOpen(false);
  };

  const filteredUniversities = universityData.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // --- Function ส่งข้อมูลเข้า Backend ---
  const handleSubmit = async () => {
    // 1. ตรวจสอบข้อมูลเบื้องต้น (Validation)
    if (
      !form.title ||
      !form.price ||
      !form.categoryId ||
      !form.courseCode ||
      !form.studyYear ||
      !form.academicYear
    ) {
      Alert.alert("ข้อผิดพลาด", "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
      return;
    }
    if (!pdfFile) {
      Alert.alert("ข้อผิดพลาด", "กรุณาอัปโหลดไฟล์ PDF");
      return;
    }
    if (previewImages.length === 0) {
      Alert.alert("ข้อผิดพลาด", "กรุณาอัปโหลดรูปภาพตัวอย่างอย่างน้อย 1 รูป");
      return;
    }
    if (!isTermsAccepted) {
      Alert.alert("ข้อผิดพลาด", "กรุณายอมรับเงื่อนไขการใช้งาน");
      return;
    }

    setIsSubmitting(true);

    try {
      // 2. จัดเตรียมข้อมูล JSON (Data object)
      const hashtagsArray = form.hashtags
        .split(",")
        .map((tag) => tag.trim().replace(/^#/, "")) // ตัดลูกน้ำและ # ออก
        .filter((tag) => tag.length > 0);

      const requestData = {
        title: form.title,
        description: form.description,
        price: parseFloat(form.price), // แปลงเป็นเลขทศนิยม (BigDecimal)
        categoryId: parseInt(form.categoryId), // แปลงเป็นตัวเลข
        universityId: form.universityId ? parseInt(form.universityId) : null,
        courseCode: form.courseCode,
        courseName: form.courseName,
        studyYear: parseInt(form.studyYear), // แปลงเป็นตัวเลข
        academicYear: form.academicYear,
        hashtags: hashtagsArray.length > 0 ? hashtagsArray : ["ชีทสรุป"], // บังคับมี 1 แท็กถ้าว่าง
      };

      // 3. สร้าง FormData
      const formData = new FormData();

      // แนบข้อมูล JSON
      formData.append("data", {
        string: JSON.stringify(requestData),
        type: "application/json",
      } as any);

      // แนบไฟล์ PDF
      formData.append("filePDF", {
        uri: pdfFile.uri,
        name: pdfFile.name || "document.pdf",
        type: pdfFile.mimeType || "application/pdf",
      } as any);

      // แนบรูปภาพพรีวิวหลายรูป
      previewImages.forEach((image, index) => {
        formData.append("previewImage", {
          uri: image.uri,
          name: image.fileName || `preview_${index}.jpg`,
          type: image.mimeType || "image/jpeg",
        } as any);
      });

      // 4. ยิง API ด้วย apiMultipartRequest
      const response = await apiMultipartRequest("/products/create", formData, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`เกิดข้อผิดพลาดในการอัปโหลด: ${response.status}`);
      }

      const responseData = await response.json();
      console.log("Success:", responseData);

      Alert.alert("สำเร็จ!", "อัปโหลดชีทสรุปเรียบร้อยแล้ว", [
        { text: "ตกลง", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถอัปโหลดชีทได้ในขณะนี้");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} disabled={isSubmitting}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>อัปโหลดชีทสรุป</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>ชื่อชีทสรุป (Title)</Text>
        <TextInput
          style={styles.input}
          placeholder="ตั้งชื่อชีทให้น่าสนใจ..."
          value={form.title}
          onChangeText={(t) => setForm({ ...form, title: t })}
        />

        {/* --- Dropdown มหาวิทยาลัย --- */}
        <Text style={styles.label}>ชื่อสถาบันที่ต้องการเผยแพร่ชีทนี้</Text>
        <TouchableOpacity
          style={[
            styles.dropdown,
            isUniDropdownOpen && {
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              borderColor: "#7A82FF",
            },
          ]}
          onPress={() => {
            setIsUniDropdownOpen(!isUniDropdownOpen);
            setIsCategoryDropdownOpen(false);
            setSearchQuery("");
          }}
        >
          <Text
            style={[styles.placeholder, selectedUniLabel && { color: "#333" }]}
          >
            {selectedUniLabel || "เลือกสถาบัน..."}
          </Text>
          <Ionicons
            name={isUniDropdownOpen ? "chevron-up" : "chevron-down"}
            size={18}
            color="#999"
          />
        </TouchableOpacity>

        {isUniDropdownOpen && (
          <View
            style={{
              borderWidth: 1,
              borderTopWidth: 0,
              borderColor: "#7A82FF",
              borderBottomLeftRadius: 12,
              borderBottomRightRadius: 12,
              backgroundColor: "#fff",
              maxHeight: 250,
              overflow: "hidden",
              zIndex: 1000,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 12,
                borderBottomWidth: 1,
                borderColor: "#E5E7EB",
                backgroundColor: "#F9FAFB",
              }}
            >
              <Ionicons name="search" size={16} color="#9CA3AF" />
              <TextInput
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  paddingHorizontal: 8,
                  fontSize: 14,
                  color: "#333",
                }}
                placeholder="พิมพ์เพื่อค้นหา..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={true}
              />
            </View>
            <ScrollView
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
            >
              {filteredUniversities.length > 0 ? (
                filteredUniversities.map((item) => (
                  <TouchableOpacity
                    key={item.value.toString()}
                    style={{
                      padding: 14,
                      borderBottomWidth: 1,
                      borderColor: "#f0f0f0",
                      backgroundColor:
                        form.universityId === item.value.toString()
                          ? "#F3F4FF"
                          : "#fff",
                    }}
                    onPress={() => selectUniversity(item)}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        color:
                          form.universityId === item.value.toString()
                            ? "#7A82FF"
                            : "#333",
                      }}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text
                  style={{ padding: 16, textAlign: "center", color: "#999" }}
                >
                  ไม่พบสถาบันที่ค้นหา
                </Text>
              )}
            </ScrollView>
          </View>
        )}

        {/* --- Dropdown ชนิดของชีท --- */}
        <Text style={styles.label}>ชนิดของชีทสรุป</Text>
        <TouchableOpacity
          style={[
            styles.dropdown,
            isCategoryDropdownOpen && {
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              borderColor: "#7A82FF",
            },
          ]}
          onPress={() => {
            setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
            setIsUniDropdownOpen(false);
          }}
        >
          <Text
            style={[
              styles.placeholder,
              selectedCategoryLabel && { color: "#333" },
            ]}
          >
            {selectedCategoryLabel || "เลือกชนิดของชีท..."}
          </Text>
          <Ionicons
            name={isCategoryDropdownOpen ? "chevron-up" : "chevron-down"}
            size={18}
            color="#999"
          />
        </TouchableOpacity>

        {isCategoryDropdownOpen && (
          <View
            style={{
              borderWidth: 1,
              borderTopWidth: 0,
              borderColor: "#7A82FF",
              borderBottomLeftRadius: 12,
              borderBottomRightRadius: 12,
              backgroundColor: "#fff",
              overflow: "hidden",
              zIndex: 999,
            }}
          >
            <ScrollView
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
            >
              {categoryData.map((item) => (
                <TouchableOpacity
                  key={item.value.toString()}
                  style={{
                    padding: 14,
                    borderBottomWidth: 1,
                    borderColor: "#f0f0f0",
                    backgroundColor:
                      form.categoryId === item.value.toString()
                        ? "#F3F4FF"
                        : "#fff",
                  }}
                  onPress={() => selectCategory(item)}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      color:
                        form.categoryId === item.value.toString()
                          ? "#7A82FF"
                          : "#333",
                    }}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* --- Input อื่นๆ --- */}
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.label}>ภาคเรียน</Text>
            <TextInput
              style={styles.input}
              placeholder="1"
              keyboardType="numeric"
              value={form.studyYear}
              onChangeText={(t) => setForm({ ...form, studyYear: t })}
            />
          </View>
          <View style={{ flex: 2 }}>
            <Text style={styles.label}>ปีการศึกษา</Text>
            <TextInput
              style={styles.input}
              placeholder="2025"
              value={form.academicYear}
              onChangeText={(t) => setForm({ ...form, academicYear: t })}
            />
          </View>
        </View>

        <Text style={styles.label}>รหัสวิชา</Text>
        <TextInput
          style={styles.input}
          placeholder="03603435-65"
          value={form.courseCode}
          onChangeText={(t) => setForm({ ...form, courseCode: t })}
        />

        <Text style={styles.label}>ชื่อรายวิชา</Text>
        <TextInput
          style={styles.input}
          placeholder="ชื่อรายวิชา..."
          value={form.courseName}
          onChangeText={(t) => setForm({ ...form, courseName: t })}
        />

        <Text style={styles.label}>รายละเอียดเนื้อหา</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="ใส่รายละเอียด เช่น บทเรียนที่สรุป..."
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          value={form.description}
          onChangeText={(t) => setForm({ ...form, description: t })}
        />

        <Text style={styles.label}>ราคาขาย (บาท)</Text>
        <TextInput
          style={styles.input}
          placeholder="20"
          keyboardType="numeric"
          value={form.price}
          onChangeText={(t) => setForm({ ...form, price: t })}
        />

        {/* --- อัปโหลดรูปภาพพรีวิว --- */}
        <Text style={styles.label}>รูปภาพตัวอย่าง (หน้าปก/เนื้อหาบางส่วน)</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 8 }}
        >
          {previewImages.map((img, index) => (
            <View key={index} style={{ marginRight: 12, position: "relative" }}>
              <Image
                source={{ uri: img.uri }}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "#ddd",
                }}
              />
              <TouchableOpacity
                style={{
                  position: "absolute",
                  top: -8,
                  right: -8,
                  backgroundColor: "white",
                  borderRadius: 12,
                }}
                onPress={() => removeImage(index)}
              >
                <Ionicons name="close-circle" size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            style={{
              width: 100,
              height: 100,
              borderWidth: 1,
              borderColor: "#7A82FF",
              borderStyle: "dashed",
              borderRadius: 8,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#F3F4FF",
            }}
            onPress={handlePickImages}
          >
            <Ionicons name="add" size={30} color="#7A82FF" />
            <Text style={{ fontSize: 12, color: "#7A82FF", marginTop: 4 }}>
              เพิ่มรูปภาพ
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* --- อัปโหลด PDF --- */}
        <Text style={styles.label}>ไฟล์ชีทสรุป (PDF เท่านั้น)</Text>
        <TouchableOpacity style={styles.uploadBox} onPress={handlePickPDF}>
          <Ionicons
            name={pdfFile ? "document-text" : "cloud-upload-outline"}
            size={40}
            color={pdfFile ? "#10B981" : "#7A82FF"}
          />
          <Text
            style={{
              marginTop: 8,
              color: pdfFile ? "#10B981" : "#7A82FF",
              fontSize: 14,
            }}
          >
            {pdfFile ? pdfFile.name : "แตะเพื่อเลือกไฟล์ PDF"}
          </Text>
        </TouchableOpacity>

        {/* แท็ก */}
        <Text style={styles.label}>แท็ก #</Text>
        <TextInput
          style={styles.input}
          placeholder="#มกศช, #cal1, #พี่ฮอตเก่งโหลด"
          value={form.hashtags}
          onChangeText={(t) => setForm({ ...form, hashtags: t })}
        />

        {/* ยอมรับเงื่อนไข */}
        <View style={styles.checkboxRow}>
          <TouchableOpacity
            style={[
              styles.checkbox,
              isTermsAccepted && { backgroundColor: "#F3F4FF" },
            ]}
            onPress={() => setIsTermsAccepted(!isTermsAccepted)}
          >
            {isTermsAccepted && <View style={styles.checkboxInner} />}
          </TouchableOpacity>
          <Text style={styles.checkboxText}>
            ฉันได้อ่านและยอมรับ ข้อกำหนดและเงื่อนไขการใช้งานแล้ว
          </Text>
        </View>

        {/* ปุ่มอัปโหลด (Submit) */}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>อัปโหลดชีทสรุป</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
