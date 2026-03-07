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
  Modal,
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
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
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
          <Ionicons name="chevron-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>อัปโหลดชีทสรุป</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: รายละเอียดชีทสรุป */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="document-text" size={20} color="#7A82FF" />
            <Text style={styles.sectionTitle}>รายละเอียดชีทสรุป</Text>
          </View>

          <Text style={[styles.label, { marginTop: 0 }]}>
            ชื่อชีทสรุป (Title)
          </Text>
          <TextInput
            style={styles.input}
            placeholder="ตั้งชื่อชีทให้น่าสนใจ..."
            placeholderTextColor="#9CA3AF"
            value={form.title}
            onChangeText={(t) => setForm({ ...form, title: t })}
          />

          <Text style={styles.label}>รายละเอียดเนื้อหา</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="ใส่รายละเอียด เช่น บทเรียนที่สรุป..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={form.description}
            onChangeText={(t) => setForm({ ...form, description: t })}
          />

          <Text style={styles.label}>แท็ก #</Text>
          <TextInput
            style={styles.input}
            placeholder="#มกศช, #cal1, #พี่ฮอตเก่งโหลด"
            placeholderTextColor="#9CA3AF"
            value={form.hashtags}
            onChangeText={(t) => setForm({ ...form, hashtags: t })}
          />
        </View>

        {/* Section 2: ข้อมูลสถาบันและรายวิชา */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="school" size={20} color="#7A82FF" />
            <Text style={styles.sectionTitle}>ข้อมูลสถาบันและรายวิชา</Text>
          </View>

          <Text style={[styles.label, { marginTop: 0 }]}>
            ชื่อสถาบันที่ต้องการเผยแพร่ชีทนี้
          </Text>
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
              style={[
                styles.placeholder,
                selectedUniLabel ? { color: "#1F2937" } : {},
              ]}
            >
              {selectedUniLabel || "เลือกสถาบัน..."}
            </Text>
            <Ionicons
              name={isUniDropdownOpen ? "chevron-up" : "chevron-down"}
              size={18}
              color="#9CA3AF"
            />
          </TouchableOpacity>

          {isUniDropdownOpen && (
            <View style={styles.dropdownMenu}>
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={16} color="#9CA3AF" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="พิมพ์เพื่อค้นหา..."
                  placeholderTextColor="#9CA3AF"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus={true}
                />
              </View>
              <ScrollView
                nestedScrollEnabled={true}
                keyboardShouldPersistTaps="handled"
                style={{ maxHeight: 200 }}
              >
                {filteredUniversities.length > 0 ? (
                  filteredUniversities.map((item) => (
                    <TouchableOpacity
                      key={item.value.toString()}
                      style={[
                        styles.dropdownItem,
                        form.universityId === item.value.toString() && {
                          backgroundColor: "#F4F6FF",
                        },
                      ]}
                      onPress={() => selectUniversity(item)}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          {
                            color:
                              form.universityId === item.value.toString()
                                ? "#7A82FF"
                                : "#1F2937",
                          },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text
                    style={{
                      padding: 16,
                      textAlign: "center",
                      color: "#9CA3AF",
                    }}
                  >
                    ไม่พบสถาบันที่ค้นหา
                  </Text>
                )}
              </ScrollView>
            </View>
          )}

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
                selectedCategoryLabel ? { color: "#1F2937" } : {},
              ]}
            >
              {selectedCategoryLabel || "เลือกชนิดของชีท..."}
            </Text>
            <Ionicons
              name={isCategoryDropdownOpen ? "chevron-up" : "chevron-down"}
              size={18}
              color="#9CA3AF"
            />
          </TouchableOpacity>

          {isCategoryDropdownOpen && (
            <View style={styles.dropdownMenu}>
              <ScrollView
                nestedScrollEnabled={true}
                keyboardShouldPersistTaps="handled"
              >
                {categoryData.map((item) => (
                  <TouchableOpacity
                    key={item.value.toString()}
                    style={[
                      styles.dropdownItem,
                      form.categoryId === item.value.toString() && {
                        backgroundColor: "#F4F6FF",
                      },
                    ]}
                    onPress={() => selectCategory(item)}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        {
                          color:
                            form.categoryId === item.value.toString()
                              ? "#7A82FF"
                              : "#1F2937",
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>ภาคเรียน</Text>
              <TextInput
                style={styles.input}
                placeholder="1"
                placeholderTextColor="#9CA3AF"
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
                placeholderTextColor="#9CA3AF"
                value={form.academicYear}
                onChangeText={(t) => setForm({ ...form, academicYear: t })}
              />
            </View>
          </View>

          <Text style={styles.label}>รหัสวิชา</Text>
          <TextInput
            style={styles.input}
            placeholder="03603435-65"
            placeholderTextColor="#9CA3AF"
            value={form.courseCode}
            onChangeText={(t) => setForm({ ...form, courseCode: t })}
          />

          <Text style={styles.label}>ชื่อรายวิชา</Text>
          <TextInput
            style={styles.input}
            placeholder="ชื่อรายวิชา..."
            placeholderTextColor="#9CA3AF"
            value={form.courseName}
            onChangeText={(t) => setForm({ ...form, courseName: t })}
          />
        </View>

        {/* Section 3: การตั้งราคา */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="pricetag" size={20} color="#7A82FF" />
            <Text style={styles.sectionTitle}>การตั้งราคา</Text>
          </View>
          <Text style={[styles.label, { marginTop: 0 }]}>ราคาขาย (บาท)</Text>
          <TextInput
            style={styles.input}
            placeholder="20"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={form.price}
            onChangeText={(t) => setForm({ ...form, price: t })}
          />
        </View>

        {/* Section 4: ไฟล์และรูปภาพตัวอย่าง */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="images" size={20} color="#7A82FF" />
            <Text style={styles.sectionTitle}>ไฟล์และรูปภาพตัวอย่าง</Text>
          </View>

          <Text style={[styles.label, { marginTop: 0 }]}>
            รูปภาพตัวอย่าง (หน้าปก/เนื้อหาบางส่วน)
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 8 }}
            contentContainerStyle={{ paddingVertical: 12, paddingRight: 12 }}
          >
            {previewImages.map((img, index) => (
              <View key={index} style={styles.imagePreviewContainer}>
                <Image source={{ uri: img.uri }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.deleteBadge}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close-circle" size={24} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={styles.addImageButton}
              onPress={handlePickImages}
            >
              <Ionicons name="add" size={32} color="#7A82FF" />
              <Text
                style={{
                  fontSize: 13,
                  color: "#7A82FF",
                  marginTop: 4,
                  fontWeight: "500",
                }}
              >
                เพิ่มรูปภาพ
              </Text>
            </TouchableOpacity>
          </ScrollView>

          <Text style={styles.label}>ไฟล์ชีทสรุป (PDF เท่านั้น)</Text>
          <TouchableOpacity style={styles.uploadBox} onPress={handlePickPDF}>
            <Ionicons
              name={pdfFile ? "document-text" : "cloud-upload"}
              size={48}
              color={pdfFile ? "#10B981" : "#7A82FF"}
            />
            <Text
              style={{
                marginTop: 12,
                color: pdfFile ? "#10B981" : "#7A82FF",
                fontSize: 14,
                fontWeight: "600",
                paddingHorizontal: 16,
                textAlign: "center",
              }}
              numberOfLines={1}
            >
              {pdfFile ? pdfFile.name : "แตะเพื่อเลือกไฟล์ PDF"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ยอมรับเงื่อนไข */}
        <View style={styles.checkboxRow}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setIsTermsAccepted(!isTermsAccepted)}
            activeOpacity={0.7}
          >
            {isTermsAccepted && <View style={styles.checkboxInner} />}
          </TouchableOpacity>
          <Text style={styles.checkboxText}>
            ฉันได้อ่านและยอมรับ{" "}
            <Text
              style={styles.linkText}
              onPress={() => setIsTermsModalOpen(true)}
            >
              ข้อกำหนดและเงื่อนไขการใช้งาน
            </Text>
            แล้ว
          </Text>
        </View>

        {/* ปุ่มอัปโหลด (Submit) */}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>อัปโหลดชีทสรุป</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Loading Modal */}
      <Modal visible={isSubmitting} transparent={true} animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7A82FF" />
            <Text style={styles.loadingText}>กำลังอัปโหลด...</Text>
            <Text style={styles.loadingSubText}>
              กรุณารอสักครู่ อาจใช้เวลาสักพักหากไฟล์มีขนาดใหญ่
            </Text>
          </View>
        </View>
      </Modal>

      {/* Terms and Conditions Modal */}
      <Modal
        visible={isTermsModalOpen}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.termsContainer}>
            <View style={styles.termsHeader}>
              <Text style={styles.termsTitle}>ข้อกำหนดและเงื่อนไข</Text>
              <TouchableOpacity onPress={() => setIsTermsModalOpen(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.termsContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.termsParagraph}>
                การใช้งานแพลตฟอร์มนี้ถือว่าผู้ใช้ได้อ่าน เข้าใจ
                และยอมรับข้อกำหนดและเงื่อนไขดังต่อไปนี้
              </Text>

              <Text style={styles.termsHeading}>
                1. การยืนยันความเป็นเจ้าของเนื้อหา
              </Text>
              <Text style={styles.termsParagraph}>
                ผู้ใช้งานรับรองว่าเนื้อหาที่อัปโหลดเป็นผลงานของตนเอง
                หรือมีสิทธิ์ในการเผยแพร่โดยชอบด้วยกฎหมาย และไม่ละเมิดลิขสิทธิ์
                ทรัพย์สินทางปัญญา หรือสิทธิของบุคคลอื่น
              </Text>

              <Text style={styles.termsHeading}>
                2. ความรับผิดชอบต่อเนื้อหา
              </Text>
              <Text style={styles.termsParagraph}>
                ผู้ใช้งานเป็นผู้รับผิดชอบต่อเนื้อหา ไฟล์ เอกสาร
                และข้อมูลทั้งหมดที่อัปโหลด หากเกิดข้อพิพาททางกฎหมาย
                ผู้ใช้งานยินยอมรับผิดชอบแต่เพียงผู้เดียว
              </Text>

              <Text style={styles.termsHeading}>3. การใช้งานที่เหมาะสม</Text>
              <Text style={styles.termsParagraph}>
                ห้ามอัปโหลดเนื้อหาที่ผิดกฎหมาย ลามก อนาจาร มีความรุนแรง
                สร้างความเกลียดชัง หลอกลวง หรือขัดต่อศีลธรรมอันดีของสังคม
              </Text>

              <Text style={styles.termsHeading}>4. สิทธิของแพลตฟอร์ม</Text>
              <Text style={styles.termsParagraph}>
                แพลตฟอร์มขอสงวนสิทธิ์ในการตรวจสอบ แก้ไข ระงับ
                หรือถอดถอนเนื้อหาที่ไม่เป็นไปตามข้อกำหนด
                โดยไม่ต้องแจ้งให้ทราบล่วงหน้า
              </Text>

              <Text style={styles.termsHeading}>5. การซื้อ–ขายและราคา</Text>
              <Text style={styles.termsParagraph}>
                ผู้ใช้งานเป็นผู้กำหนดราคาเนื้อหาเอง
                แพลตฟอร์มไม่รับผิดชอบต่อข้อพิพาทที่เกิดจากการซื้อ–ขายระหว่างผู้ใช้
              </Text>

              <Text style={styles.termsHeading}>6. การจำกัดความรับผิด</Text>
              <Text style={styles.termsParagraph}>
                แพลตฟอร์มไม่รับประกันความถูกต้อง ความสมบูรณ์
                หรือความเหมาะสมของเนื้อหา และไม่รับผิดชอบต่อความเสียหายใด ๆ
                ที่เกิดจากการใช้งาน
              </Text>

              <Text style={styles.termsHeading}>7. การเปลี่ยนแปลงเงื่อนไข</Text>
              <Text style={styles.termsParagraph}>
                แพลตฟอร์มขอสงวนสิทธิ์ในการแก้ไขข้อกำหนดและเงื่อนไขโดยไม่ต้องแจ้งล่วงหน้า
                การใช้งานต่อไปถือว่ายอมรับเงื่อนไขที่แก้ไขแล้ว
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.acceptTermsButton}
              onPress={() => {
                setIsTermsAccepted(true);
                setIsTermsModalOpen(false);
              }}
            >
              <Text style={styles.acceptTermsButtonText}>
                ฉันเข้าใจและยอมรับ
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
