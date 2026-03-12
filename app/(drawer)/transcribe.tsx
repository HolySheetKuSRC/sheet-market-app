import { Ionicons } from '@expo/vector-icons';
import { Mitr_400Regular, Mitr_500Medium, Mitr_600SemiBold, useFonts } from '@expo-google-fonts/mitr';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import { useNavigation, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    KeyboardAvoidingView,
    Modal,
    PanResponder,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { getSessionToken } from '../../utils/token';
import { useNotification } from '../_layout';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const AI_API_URL = process.env.EXPO_PUBLIC_AI_API_URL?.replace(/\/$/, '') || 'http://165.232.171.127';

// ── JWT Debug Helper ──────────────────────────────────────────────────────────
const decodeJWT = (token: string): object => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (e) {
        return { error: 'Failed to decode token. Not a valid JWT.' };
    }
};
// ─────────────────────────────────────────────────────────────────────────────

const THEME = {
    primary: "#6366F1",
    primaryDark: "#4F46E5",
    secondary: "#10B981",
    accent1: "#C084FC",
    accent2: "#8484FC",
    danger: "#EF4444",
    bg: "#F8F9FE",
    surface: "#FFFFFF",
    textMain: "#292524",
    textSub: "#626B7F",
    textMuted: "#979FAF",
    border: "#E5E7EB",
    inputBg: "#FFFFFF",
};

const TOS_TEXT = `นโยบายการใช้ AI เพื่อบันทึกเสียงและประมวลผลในเชิงพาณิชย์ (สำหรับ Marketplace/EdTech Platform)

1. ขออนุญาตอาจารย์หรือเจ้าของเนื้อหาก่อนบันทึกเสียง
ผู้ใช้ต้องได้รับความยินยอมจากอาจารย์หรือเจ้าของเนื้อหาก่อนเริ่มบันทึกเสียงหรือใช้ AI เพื่อประมวลผลเนื้อหาในคาบเรียนหรือกิจกรรมการเรียนการสอน

2. บทบาทของแพลตฟอร์ม
แพลตฟอร์มเป็นเพียงตัวกลางในการให้บริการบันทึกและประมวลผลเสียง หากเกิดปัญหาทางกฎหมายหรือข้อพิพาทใด ๆ ระหว่างผู้ใช้และบุคคลที่สาม แพลตฟอร์มจะไม่รับผิดชอบใด ๆ ทั้งสิ้น

3. การจัดการข้อมูลเสียง
หลังจากประมวลผลด้วย AI เสร็จสิ้น ไฟล์เสียงต้นฉบับจะถูกลบออกจากระบบภายใน 24 ชั่วโมง เพื่อป้องกันการละเมิดสิทธิส่วนบุคคลและความเป็นส่วนตัว

4. การใช้ข้อมูลเพื่อเชิงพาณิชย์
ข้อมูลเสียงและผลลัพธ์ที่ได้จาก AI สามารถนำไปใช้ในเชิงพาณิชย์ เช่น การขายสรุปเนื้อหา การสร้างผลิตภัณฑ์ดิจิทัล หรือบริการอื่น ๆ ได้ โดยต้องไม่ละเมิดลิขสิทธิ์หรือสิทธิของบุคคลที่สาม
ผู้ใช้ต้องรับผิดชอบต่อการใช้ข้อมูลในเชิงพาณิชย์และต้องปฏิบัติตามกฎหมายลิขสิทธิ์และกฎหมายที่เกี่ยวข้อง

5. ความเป็นส่วนตัวและการคุ้มครองข้อมูล
แพลตฟอร์มจะปฏิบัติตามกฎหมายคุ้มครองข้อมูลส่วนบุคคล (PDPA) และกฎหมายที่เกี่ยวข้อง
ผู้ใช้ต้องไม่บันทึกเสียงหรือข้อมูลส่วนบุคคลของผู้อื่นโดยไม่ได้รับอนุญาต

6. ข้อควรระวังเพิ่มเติม
หากมีการละเมิดนโยบายนี้ ผู้ใช้จะถูกระงับสิทธิ์การใช้งานและอาจถูกดำเนินคดีตามกฎหมาย
ห้ามใช้ AI เพื่อสร้างหรือเผยแพร่เนื้อหาที่ผิดกฎหมาย ละเมิดลิขสิทธิ์ หรือขัดต่อจริยธรรม`;

export default function TranscribeScreen() {
    const navigation = useNavigation();
    const router = useRouter();
    const notify = useNotification();
    const [fontsLoaded] = useFonts({ Mitr_400Regular, Mitr_500Medium, Mitr_600SemiBold });

    // Responsive layout
    const { width } = useWindowDimensions();
    const isLargeScreen = width >= 768;

    // Sidebar width state for draggable resizer
    const [rightWidth, setRightWidth] = useState(340);
    const rightWidthRef = useRef(340); // snapshot at drag-start to avoid cumulative dx jump
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                rightWidthRef.current = rightWidth; // capture once on touch-down
            },
            onPanResponderMove: (_, gestureState) => {
                // dx is cumulative from touch-start, so use snapshot
                let newWidth = rightWidthRef.current - gestureState.dx;
                if (newWidth < 250) newWidth = 250;
                if (newWidth > width * 0.6) newWidth = width * 0.6;
                setRightWidth(newWidth);
            },
        })
    ).current;

    // ToS state
    const [isTosAccepted, setIsTosAccepted] = useState(false);
    const [showTosModal, setShowTosModal] = useState(false);

    // Glow animation
    const glowAnim = useRef(new Animated.Value(0.6)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
                Animated.timing(glowAnim, { toValue: 0.6, duration: 1200, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [audioUri, setAudioUri] = useState<string | null>(null);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [customTitle, setCustomTitle] = useState<string>('');
    const [originalFileName, setOriginalFileName] = useState<string>('');

    // Job & Polling States
    const [jobId, setJobId] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'recording' | 'uploading' | 'processing' | 'completed' | 'failed'>('idle');
    const [resultText, setResultText] = useState<string>('');
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);

    const [loadingMessage, setLoadingMessage] = useState<string>('');

    // History State (real API)
    type HistoryItem = {
        id: string;
        job_id?: string;
        filename: string;
        status: 'pending' | 'processing' | 'completed' | 'failed';
        created_at: string;
        result_text?: string;
    };
    const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
    const [deletingJobId, setDeletingJobId] = useState<string | null>(null);

    useEffect(() => {
        loadHistory();
    }, []);

    const handleDelete = async (jobIdToDelete: string) => {
        const proceedDelete = async () => {
            setDeletingJobId(jobIdToDelete);
            try {
                const rawToken = await getSessionToken();
                const token = rawToken ? rawToken.replace(/^"|"$/g, '').trim() : null;
                if (!token) {
                    Alert.alert('Auth Error', 'No valid session token. Please log in again.');
                    setDeletingJobId(null);
                    return;
                }

                const response = await fetch(`${AI_API_URL}/api/audio/jobs/${jobIdToDelete}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                if (response.ok) {
                    setHistoryList(prev => prev.filter(item => (item.job_id || item.id) !== jobIdToDelete));
                    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                } else {
                    Alert.alert('Error', `ลบไม่สำเร็จ (${response.status})`);
                }
            } catch (error) {
                console.error("Delete error:", error);
                Alert.alert('Error', 'เกิดข้อผิดพลาดในการลบประวัติ');
            } finally {
                setDeletingJobId(null);
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบประวัตินี้?")) {
                proceedDelete();
            }
        } else {
            Alert.alert(
                "ยืนยันการลบ",
                "คุณแน่ใจหรือไม่ว่าต้องการลบประวัตินี้?",
                [
                    { text: "ยกเลิก", style: "cancel" },
                    { text: "ลบ", style: "destructive", onPress: proceedDelete }
                ]
            );
        }
    };

    const loadHistory = async () => {
        if (!AI_API_URL) return;
        try {
            const rawToken = await getSessionToken(); // ดึง JWT ของจริงมาใช้
            // Sanitize: strip accidental surrounding quotes / whitespace
            const token = rawToken ? rawToken.replace(/^"|"$/g, '').trim() : null;

            console.log('=== TOKEN DEBUG (loadHistory) ===');
            console.log('Raw Token   :', rawToken);
            console.log('Sanitized   :', token);
            console.log('Decoded     :', token ? decodeJWT(token) : 'No token to decode');
            console.log('=================================');

            if (!token) {
                console.error('Token is null or empty. Aborting history fetch.');
                return;
            }

            const response = await fetch(`${AI_API_URL}/api/audio/history`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setHistoryList(data);
            } else {
                const errText = await response.text();
                console.warn('History fetch failed:', response.status, errText);
            }
        } catch (error) {
            console.error('Failed to fetch history', error);
        }
    };

    const formatDate = (iso: string): string => {
        try {
            return new Date(iso).toLocaleString('th-TH', {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
            });
        } catch {
            return iso;
        }
    };

    const handleSave = async () => {
        if (!jobId) {
            // No job context (e.g. user loaded from history) — just exit edit mode
            setIsEditing(false);
            return;
        }
        setIsSaving(true);
        try {
            const rawToken = await getSessionToken();
            const token = rawToken ? rawToken.replace(/^"|"$/g, '').trim() : null;
            if (!token) {
                Alert.alert('Auth Error', 'No valid session token. Please log in again.');
                return;
            }

            const response = await fetch(`${AI_API_URL}/api/audio/jobs/${jobId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ result_text: resultText }),
            });

            if (response.ok) {
                setIsEditing(false);
                Alert.alert('สำเร็จ', 'บันทึกการแก้ไขเรียบร้อยแล้ว');
                loadHistory(); // refresh sidebar to reflect any changes
            } else {
                const errText = await response.text();
                Alert.alert('Error', `บันทึกไม่สำเร็จ (${response.status}): ${errText}`);
            }
        } catch (error) {
            console.error('Save error:', error);
            Alert.alert('Error', 'เกิดข้อผิดพลาดในการบันทึก');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSelectHistory = async (item: HistoryItem) => {
        setIsEditing(false);
        if (item.status !== 'completed') {
            Alert.alert('Info', `This transcription is "${item.status}" and has no text yet.`);
            return;
        }
        // If the list already includes the text, load it immediately
        if (item.result_text && typeof item.result_text === 'string') {
            setJobId(item.job_id ?? item.id);
            setResultText(item.result_text);
            setStatus('completed');
            return;
        }
        // Fallback: fetch full job details from the AI microservice
        try {
            const rawToken = await getSessionToken();
            const token = rawToken ? rawToken.replace(/^"|"$/g, '').trim() : null;
            if (!token) {
                Alert.alert('Auth Error', 'No valid session token. Please log in again.');
                return;
            }
            const selectedJobId = item.job_id ?? item.id;
            setJobId(selectedJobId);
            const detailResponse = await fetch(`${AI_API_URL}/sheets/jobs/${selectedJobId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (detailResponse.ok) {
                const data = await detailResponse.json();
                const text =
                    data.result?.summary ||
                    data.result?.transcribed_text ||
                    data.result?.raw_text_snippet ||
                    data.result?.text ||
                    'No transcription text available.';
                setResultText(text);
                setStatus('completed');
            } else {
                Alert.alert('Error', `Failed to load transcription (${detailResponse.status}).`);
            }
        } catch (error) {
            console.error('Failed to fetch history details:', error);
            Alert.alert('Error', 'Could not load transcription details.');
        }
    };

    // Cleanup sound on unmount
    useEffect(() => {
        return sound
            ? () => {
                sound.unloadAsync();
            }
            : undefined;
    }, [sound]);

    // 1. Audio Recording
    async function startRecording() {
        try {
            if (Platform.OS !== "web") Haptics.selectionAsync();

            const permItem = await Audio.requestPermissionsAsync();
            if (permItem.status !== 'granted') {
                Alert.alert('Permission needed', 'Please grant audio recording permissions.');
                return;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            setRecording(recording);
            setAudioUri(null);
            setStatus('recording');
        } catch (err) {
            console.error('Failed to start recording', err);
            Alert.alert('Error', 'Could not start recording');
        }
    }

    async function stopRecording() {
        try {
            if (Platform.OS !== "web") Haptics.selectionAsync();
            if (!recording) return;

            setStatus('idle');
            await recording.stopAndUnloadAsync();

            const uri = recording.getURI();
            setRecording(null);

            if (uri) {
                setAudioUri(uri);
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
            });
        } catch (error) {
            console.error('Failed to stop recording', error);
            Alert.alert('Error', 'Could not stop recording');
        }
    }

    // 2. Upload Audio File from Device
    async function pickAudioFile() {
        try {
            if (Platform.OS !== "web") Haptics.selectionAsync();

            const result = await DocumentPicker.getDocumentAsync({
                type: ['audio/*'],
                copyToCacheDirectory: true
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                const actualFileName =
                    (asset as any).name ||
                    ((asset as any).file && (asset as any).file.name) ||
                    asset.uri.split('/').pop() ||
                    'audio_upload.mp3';
                setOriginalFileName(actualFileName);
                setAudioUri(asset.uri);
                setStatus('idle');
            }
        } catch (error) {
            console.error("Error picking document", error);
            Alert.alert("Error", "Could not pick an audio file");
        }
    }

    // 2.5 Audio Preview Playback
    async function playAudio() {
        try {
            if (!audioUri) return;
            if (sound) {
                if (isPlaying) {
                    await sound.pauseAsync();
                    setIsPlaying(false);
                } else {
                    await sound.playAsync();
                    setIsPlaying(true);
                }
                return;
            }

            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: audioUri },
                { shouldPlay: true }
            );
            setSound(newSound);
            setIsPlaying(true);

            newSound.setOnPlaybackStatusUpdate((playbackStatus) => {
                if (playbackStatus.isLoaded && playbackStatus.didJustFinish) {
                    setIsPlaying(false);
                }
            });
        } catch (error) {
            console.error("Playback error:", error);
            Alert.alert("Playback Error", "Could not play the audio file.");
        }
    }

    // 3. API Upload & Start Job
    async function uploadAudio() {
        if (!audioUri) {
            Alert.alert('Error', 'No audio file to upload');
            return;
        }

        if (!AI_API_URL) {
            Alert.alert('Config Error', 'AI API URL is not defined in environment variables');
            return;
        }

        try {
            setStatus('uploading');
            setLoadingMessage('Uploading audio file...');

            const formData = new FormData();
            const sourceFilename = audioUri.split('/').pop() || 'recording.m4a';
            const ext = sourceFilename.split('.').pop()?.toLowerCase() || 'm4a';
            const mimeType = ext === 'mp3' ? 'audio/mpeg'
                : ext === 'wav' ? 'audio/wav'
                : ext === 'ogg' ? 'audio/ogg'
                : ext === 'flac' ? 'audio/flac'
                : 'audio/m4a';

            // Determine final filename: prefer customTitle, fallback to originalFileName / sourceFilename
            let baseName = customTitle.trim() || originalFileName || sourceFilename;
            // Strip existing extension from baseName so we can re-attach the correct one
            let finalFileName = baseName.replace(/\.(wav|mp3|m4a|ogg|flac)$/i, '');
            // Re-attach a valid extension
            const extMatch = (originalFileName || sourceFilename).match(/\.(wav|mp3|m4a|ogg|flac)$/i);
            if (mimeType.includes('wav')) finalFileName += '.wav';
            else if (mimeType.includes('m4a') || mimeType.includes('mp4')) finalFileName += '.m4a';
            else if (mimeType.includes('ogg')) finalFileName += '.ogg';
            else if (mimeType.includes('flac')) finalFileName += '.flac';
            else finalFileName += extMatch ? extMatch[0] : '.mp3';

            if (Platform.OS === 'web') {
                const blobResponse = await fetch(audioUri);
                const blob = await blobResponse.blob();
                formData.append('file', blob, finalFileName);
            } else {
                formData.append('file', {
                    uri: audioUri,
                    name: finalFileName,
                    type: mimeType,
                } as any);
            }

            // Use native fetch — do NOT set Content-Type manually.
            // The runtime adds 'multipart/form-data; boundary=...' automatically.
            const rawToken = await getSessionToken(); // ดึง JWT ของจริงมาใช้
            // Sanitize: strip accidental surrounding quotes / whitespace
            const token = rawToken ? rawToken.replace(/^"|"$/g, '').trim() : null;

            console.log('=== TOKEN DEBUG (uploadAudio) ===');
            console.log('Raw Token   :', rawToken);
            console.log('Sanitized   :', token);
            console.log('Decoded     :', token ? decodeJWT(token) : 'No token to decode');
            console.log('=================================');

            if (!token) {
                setStatus('failed');
                Alert.alert('Auth Error', 'No valid session token found. Please log in again.');
                return;
            }

            const fetchResponse = await fetch(`${AI_API_URL}/api/audio/transcribe`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (fetchResponse.status === 422) {
                const errorData = await fetchResponse.json();
                console.error(
                    '422 FastAPI Validation Error:\n',
                    JSON.stringify(errorData.detail, null, 2)
                );
                throw new Error('Upload format error (422). Check console for FastAPI detail.');
            }

            if (!fetchResponse.ok) {
                const text = await fetchResponse.text();
                throw new Error(`Server error ${fetchResponse.status}: ${text}`);
            }

            const responseData = await fetchResponse.json();

            if (responseData && responseData.job_id) {
                setJobId(responseData.job_id);
                setStatus('processing');
                setLoadingMessage('Processing transcription...');
                loadHistory(); // refresh sidebar after successful upload
            } else {
                throw new Error("Invalid response from server");
            }

        } catch (error: any) {
            setStatus('failed');
            // 422 errors are already logged inside the try block above;
            // all other failures surface here as plain Error objects.
            console.error('Upload error:', error);
            Alert.alert('Upload Failed', error.message || 'An error occurred during upload.');
        }
    }

    // 4. Polling Mechanism
    useEffect(() => {
        let pollInterval: ReturnType<typeof setInterval>;
        let retries = 0;
        const MAX_RETRIES = 120; // 10 minutes (5s * 120)

        if (status === 'processing' && jobId) {
            pollInterval = setInterval(async () => {
                try {
                    if (retries >= MAX_RETRIES) {
                        clearInterval(pollInterval);
                        setStatus('failed');
                        Alert.alert('Timeout', 'Transcription job took too long.');
                        return;
                    }
                    retries++;

                    const pollToken = await getSessionToken();
                    const pollResponse = await fetch(`${AI_API_URL}/sheets/jobs/${jobId}`, {
                        headers: pollToken ? { 'Authorization': `Bearer ${pollToken}` } : {},
                    });
                    if (!pollResponse.ok) {
                        console.warn('Polling error:', pollResponse.status);
                        return;
                    }
                    const data = await pollResponse.json();

                    if (data.status === 'completed') {
                        clearInterval(pollInterval);
                        setStatus('completed');
                        // Extract transcription text from all known result fields
                        const text =
                            data.result?.summary ||
                            data.result?.transcribed_text ||
                            data.result?.raw_text_snippet ||
                            data.result?.text ||
                            'No transcription text was returned.';
                        setResultText(text);

                        // Clean up the local audio file after success
                        if (audioUri && Platform.OS !== 'web') {
                            await FileSystem.deleteAsync(audioUri, { idempotent: true });
                        }
                        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        loadHistory(); // refresh sidebar when job completes
                    } else if (data.status === 'failed') {
                        clearInterval(pollInterval);
                        setStatus('failed');
                        Alert.alert('Transcription Failed', data.error_message || 'The backend failed to process the audio.');
                        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                    }
                } catch (error) {
                    console.error('Polling error:', error);
                }
            }, 5000);
        }

        return () => {
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [status, jobId, audioUri]);

    // 5. PDF Generation & Export (Thai Support)
    async function generateAndExportPDF() {
        if (!resultText) return;

        try {
            if (Platform.OS !== "web") Haptics.selectionAsync();

            const htmlContent = `
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap');
                body { 
                  font-family: 'Sarabun', sans-serif; 
                  font-size: 16px; 
                  line-height: 1.6; 
                  padding: 30px; 
                  color: #11181C; 
                }
                h1 { 
                  font-family: 'Sarabun', sans-serif; 
                  color: #4F46E5; 
                  margin-bottom: 20px;
                }
                .content {
                  white-space: pre-wrap;
                }
            </style>
        </head>
        <body>
            <h1>Audio Transcription Result</h1>
            <div class="content">${resultText}</div>
        </body>
        </html>
      `;

            const { uri } = await Print.printToFileAsync({ html: htmlContent });

            const isSharingAvailable = await Sharing.isAvailableAsync();
            if (isSharingAvailable) {
                await Sharing.shareAsync(uri);
            } else {
                Alert.alert("Success", `PDF saved to: ${uri}`);
            }
        } catch (error) {
            console.error("PDF Export error:", error);
            Alert.alert('Export Failed', 'Could not generate or share the PDF.');
        }
    }

    // UI Rendering
    return (
        <View style={styles.container}>
            {/* Top Bar */}
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => router.push('/(drawer)/home')}>
                    <Ionicons name="chevron-back" size={28} color={THEME.textMain} />
                </TouchableOpacity>
                <Text style={styles.topBarTitle}>ถอดเสียง AI</Text>
                <TouchableOpacity onPress={() => notify("ฟีเจอร์นี้ให้ AI ถอดเสียงพร้อมสรุปเนื้อหาทันที! 🎤")}>
                    <Ionicons name="information-circle-outline" size={24} color={THEME.textMain} />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex1}
            >
                <View style={[styles.layoutWrapper, { flexDirection: isLargeScreen ? 'row' : 'column' }]}>
                    {/* LEFT / CENTER COLUMN */}
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        style={{ flex: 1 }}
                    >
                        {/* Header */}
                        <View style={styles.headerSection}>
                            <Text style={styles.greetingTitle}>เริ่มเลกเชอร์ใหม่</Text>
                            <Text style={styles.greetingSubtitle}>แตะเพื่อเริ่มอัด แล้วให้ AI ช่วยจดให้เอง</Text>
                        </View>

                        {/* Dashboard Content */}
                        <View style={styles.dashboardCard}>

                            {/* STATUS: UPLOADING / PROCESSING */}
                            {(status === 'uploading' || status === 'processing') ? (
                                <View style={styles.loadingContainer}>
                                    <Animated.View style={{ opacity: glowAnim }}>
                                        <LinearGradient
                                            colors={[THEME.accent1, THEME.accent2]}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={{ width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <ActivityIndicator size="large" color="#FFF" />
                                        </LinearGradient>
                                    </Animated.View>
                                    <Text style={styles.loadingText}>{loadingMessage}</Text>
                                    <Text style={styles.subLoadingText}>อาจใช้เวลาสักครู่ กรุณารอสักครู่...</Text>
                                </View>
                            ) : status === 'completed' ? (
                                <View style={styles.editorContainer}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <Text style={[styles.inputLabel, { marginBottom: 0 }]}>Transcription Result</Text>
                                        <TouchableOpacity
                                            onPress={isEditing ? handleSave : () => setIsEditing(true)}
                                            disabled={isSaving}
                                            style={{ flexDirection: 'row', alignItems: 'center', opacity: isSaving ? 0.5 : 1 }}
                                        >
                                            {isSaving ? (
                                                <ActivityIndicator size="small" color={THEME.primary} />
                                            ) : (
                                                <Ionicons name={isEditing ? "checkmark-circle" : "pencil"} size={18} color={THEME.primary} />
                                            )}
                                            <Text style={{ marginLeft: 4, color: THEME.primary, fontWeight: '600', fontFamily: 'Mitr_500Medium' }}>
                                                {isSaving ? 'Saving...' : isEditing ? 'Save' : 'Edit'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    {isEditing ? (
                                        <TextInput
                                            style={[styles.markdownWrapper, { fontSize: 16, textAlignVertical: 'top', color: THEME.textMain, fontFamily: 'Mitr_400Regular' }]}
                                            multiline
                                            value={resultText}
                                            onChangeText={setResultText}
                                            placeholder="Transcription result will appear here..."
                                        />
                                    ) : (
                                        <ScrollView style={styles.markdownWrapper}>
                                            <Markdown style={markdownStyles}>
                                                {resultText || 'Transcription result will appear here...'}
                                            </Markdown>
                                        </ScrollView>
                                    )}

                                    <View style={styles.buttonRow}>
                                        <TouchableOpacity
                                            style={[styles.mainButton, styles.exportButton]}
                                            onPress={generateAndExportPDF}
                                        >
                                            <Text style={styles.mainButtonText}>Export to PDF</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.mainButton, { flex: 1, marginLeft: 10 }]}
                                            onPress={() => {
                                                setStatus('idle');
                                                setResultText('');
                                                setAudioUri(null);
                                                setJobId(null);
                                                setIsEditing(false);
                                            }}
                                        >
                                            <Text style={styles.mainButtonText}>New Transcription</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                /* RECORDING / UPLOAD CONTROLS */
                                <View style={styles.controlsContainer}>

                                    {audioUri ? (
                                        <View style={styles.audioReadyContainer}>
                                            <LinearGradient
                                                colors={[THEME.accent1, THEME.primary]}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                style={styles.audioIconWrapper}
                                            >
                                                <Ionicons name="document-text" size={40} color="#FFF" />
                                            </LinearGradient>
                                            <Text style={styles.audioReadyText}>ไฟล์เสียงพร้อมแล้ว</Text>

                                            <TextInput
                                                style={styles.titleInput}
                                                placeholder="ตั้งชื่อเลกเชอร์ (เช่น Lecture 1: AI)..."
                                                placeholderTextColor={THEME.textMuted}
                                                value={customTitle}
                                                onChangeText={setCustomTitle}
                                            />

                                            <TouchableOpacity
                                                style={styles.playButtonRow}
                                                onPress={playAudio}
                                            >
                                                <Ionicons name={isPlaying ? "pause-circle" : "play-circle"} size={32} color={THEME.primary} />
                                                <Text style={styles.playText}>
                                                    {isPlaying ? 'กำลังเล่น...' : 'ทดลองฟังเสียง'}
                                                </Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                style={[styles.mainButton, { marginTop: 24, width: '100%' }]}
                                                onPress={uploadAudio}
                                            >
                                                <Text style={styles.mainButtonText}>เริ่มถอดเสียงกันเลย</Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                style={[styles.secondaryButton, { marginTop: 12 }]}
                                                onPress={() => {
                                                    setAudioUri(null);
                                                    setCustomTitle('');
                                                    setOriginalFileName('');
                                                    if (sound) sound.unloadAsync();
                                                    setSound(null);
                                                    setIsPlaying(false);
                                                }}
                                            >
                                                <Text style={styles.secondaryButtonText}>ยกเลิก / เลือกไฟล์ใหม่</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <>
                                            {/* Animated wave bars */}
                                            <View style={styles.waveContainer}>
                                                {[0.4, 0.7, 1, 0.7, 0.4].map((h, i) => (
                                                    <Animated.View
                                                        key={i}
                                                        style={[
                                                            styles.waveBar,
                                                            {
                                                                height: 20 * h * (status === 'recording' ? 2 : 1),
                                                                opacity: status === 'recording' ? glowAnim : 0.35,
                                                            },
                                                        ]}
                                                    />
                                                ))}
                                            </View>

                                            {/* Record Button */}
                                            <TouchableOpacity
                                                style={[styles.recordButton, status === 'recording' && styles.recordingActive]}
                                                onPress={() => {
                                                    if (!isTosAccepted) {
                                                        Alert.alert('กรุณายอมรับเงื่อนไข', 'กรุณายอมรับเงื่อนไขก่อนใช้งาน');
                                                        return;
                                                    }
                                                    status === 'recording' ? stopRecording() : startRecording();
                                                }}
                                                disabled={!isTosAccepted && status !== 'recording'}
                                            >
                                                <Animated.View style={{ opacity: status === 'recording' ? glowAnim : 1 }}>
                                                    <LinearGradient
                                                        colors={status === 'recording' ? [THEME.danger, '#FF8A80'] : [THEME.accent1, THEME.primary]}
                                                        start={{ x: 0, y: 0 }}
                                                        end={{ x: 1, y: 1 }}
                                                        style={[
                                                            styles.recordInner,
                                                            status === 'recording' && styles.recordInnerActive
                                                        ]}
                                                    />
                                                </Animated.View>
                                            </TouchableOpacity>
                                            <Text style={styles.controlLabel}>
                                                {status === 'recording' ? 'แตะเพื่อหยุดบันทึก' : 'แตะเพื่อเริ่มบันทึก'}
                                            </Text>

                                            <View style={styles.divider}>
                                                <View style={styles.dividerLine} />
                                                <Text style={styles.dividerText}>หรือ</Text>
                                                <View style={styles.dividerLine} />
                                            </View>

                                            {/* Upload Button */}
                                            <TouchableOpacity
                                                style={styles.uploadButton}
                                                onPress={() => {
                                                    if (!isTosAccepted) {
                                                        Alert.alert('กรุณายอมรับเงื่อนไข', 'กรุณายอมรับเงื่อนไขก่อนใช้งาน');
                                                        return;
                                                    }
                                                    pickAudioFile();
                                                }}
                                                disabled={!isTosAccepted}
                                            >
                                                <Ionicons name="cloud-upload-outline" size={20} color={THEME.primary} style={{ marginRight: 8 }} />
                                                <Text style={styles.uploadButtonText}>Audio Upload</Text>
                                            </TouchableOpacity>

                                            {/* ToS Checkbox */}
                                            <View style={styles.tosContainer}>
                                                <TouchableOpacity
                                                    onPress={() => setIsTosAccepted(!isTosAccepted)}
                                                    style={styles.tosCheckbox}
                                                >
                                                    <Ionicons
                                                        name={isTosAccepted ? "checkbox" : "square-outline"}
                                                        size={22}
                                                        color={isTosAccepted ? THEME.primary : THEME.textMuted}
                                                    />
                                                </TouchableOpacity>
                                                <Text style={styles.tosText}>
                                                    ฉันได้อ่านและยอมรับ{' '}
                                                    <Text
                                                        style={styles.tosLink}
                                                        onPress={() => setShowTosModal(true)}
                                                    >
                                                        ข้อกำหนดและเงื่อนไขการใช้งาน (Terms of Service)
                                                    </Text>
                                                    {' '}แล้ว
                                                </Text>
                                            </View>
                                        </>
                                    )}
                                </View>
                            )}
                        </View>
                        <View style={{ height: 40 }} />
                    </ScrollView>

                    {/* Draggable Resizer — only on large screens */}
                    {isLargeScreen && (
                        <View
                            {...panResponder.panHandlers}
                            style={styles.resizerHitArea}
                        >
                            <View style={styles.resizerLine} />
                        </View>
                    )}

                    {/* RIGHT COLUMN: RECORD HISTORY */}
                    <View style={[styles.sidebarColumn, isLargeScreen ? { width: rightWidth } : { width: '100%' }]}>
                        <Text style={styles.sidebarTitle}>Record History</Text>
                        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                            {historyList.length === 0 && (
                                <Text style={{ color: THEME.textMuted, fontSize: 13, textAlign: 'center', marginTop: 20, fontFamily: 'Mitr_400Regular' }}>ยังไม่มีประวัติการถอดเสียง</Text>
                            )}
                            {historyList.map(item => (
                                <TouchableOpacity
                                    key={item.id ?? item.job_id}
                                    style={styles.historyCard}
                                    onPress={() => handleSelectHistory(item)}
                                >
                                    <View style={styles.historyHeader}>
                                        <Text style={styles.historyItemTitle} numberOfLines={1}>{item.filename}</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            {/* Status Badge */}
                                            {(item.status === 'processing' || item.status === 'pending') ? (
                                                <LinearGradient
                                                    colors={[THEME.accent1, THEME.accent2]}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 0 }}
                                                    style={styles.historyBadge}
                                                >
                                                    <Text style={styles.historyBadgeText}>{item.status}</Text>
                                                </LinearGradient>
                                            ) : (
                                                <View style={[
                                                    styles.historyBadge,
                                                    item.status === 'completed' ? styles.badgeSuccess : styles.badgeDanger
                                                ]}>
                                                    <Text style={styles.historyBadgeText}>{item.status}</Text>
                                                </View>
                                            )}
                                            {/* Delete button */}
                                            <TouchableOpacity
                                                style={{ marginLeft: 8, padding: 4 }}
                                                onPress={(e) => {
                                                    e.stopPropagation?.();
                                                    const idToDelete = item.job_id || item.id;
                                                    if (idToDelete) handleDelete(idToDelete);
                                                }}
                                                disabled={deletingJobId === (item.job_id || item.id)}
                                            >
                                                {deletingJobId === (item.job_id || item.id) ? (
                                                    <ActivityIndicator size="small" color={THEME.danger} />
                                                ) : (
                                                    <Ionicons name="trash-outline" size={18} color={THEME.danger} />
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                    <View style={styles.historyFooter}>
                                        <Ionicons name="time-outline" size={14} color={THEME.textMuted} />
                                        <Text style={styles.historyDateText}>{formatDate(item.created_at)}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </KeyboardAvoidingView>

            {/* ToS Modal */}
            <Modal visible={showTosModal} transparent animationType="slide" onRequestClose={() => setShowTosModal(false)}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
                    <View style={{ backgroundColor: '#FFF', borderRadius: 16, maxHeight: '85%', flexShrink: 1, overflow: 'hidden' }}>
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>ข้อกำหนดและเงื่อนไขการใช้งาน</Text>
                            <TouchableOpacity onPress={() => setShowTosModal(false)}>
                                <Ionicons name="close-circle" size={28} color={THEME.textMuted} />
                            </TouchableOpacity>
                        </View>
                        {/* Body — flexGrow so ScrollView expands on iPad */}
                        <ScrollView
                            style={{ flexGrow: 1 }}
                            contentContainerStyle={{ padding: 20, paddingBottom: 8 }}
                        >
                            <Text style={{ fontSize: 15, lineHeight: 24, color: '#000', fontFamily: 'Mitr_400Regular' }}>
                                {TOS_TEXT}
                            </Text>
                        </ScrollView>
                        {/* Accept button */}
                        <TouchableOpacity
                            style={[styles.mainButton, { margin: 16 }]}
                            onPress={() => { setIsTosAccepted(true); setShowTosModal(false); }}
                        >
                            <Text style={styles.mainButtonText}>ยอมรับเงื่อนไข</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    flex1: { flex: 1 },
    layoutWrapper: {
        flex: 1,
    },
    sidebarColumn: {
        backgroundColor: '#FFF',
        borderLeftWidth: 1,
        borderTopWidth: 1,
        borderColor: THEME.border,
        padding: 20,
    },
    resizerHitArea: {
        width: 30,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        backgroundColor: 'transparent',
        ...(Platform.OS === 'web' ? { cursor: 'col-resize' } as any : {}),
    },
    resizerLine: {
        width: 3,
        height: '100%',
        backgroundColor: THEME.border,
        borderRadius: 2,
    },
    sidebarTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: 'black',
        marginBottom: 16,
        fontFamily: 'Mitr_600SemiBold',
    },
    historyCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: THEME.border,
        ...Platform.select({
            web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.04)' },
            default: { elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
        }),
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    historyItemTitle: {
        fontSize: 17,
        fontWeight: '500',
        color: 'black',
        flex: 1,
        marginRight: 8,
        fontFamily: 'Mitr_500Medium',
    },
    historyBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeSuccess: { backgroundColor: THEME.secondary },
    badgeDanger: { backgroundColor: THEME.danger },
    historyBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
        fontFamily: 'Mitr_500Medium',
    },
    historyFooter: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    historyDateText: {
        fontSize: 12,
        color: THEME.textMuted,
        marginLeft: 4,
        fontFamily: 'Mitr_400Regular',
    },
    container: { flex: 1, backgroundColor: THEME.bg },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFF',
        paddingTop: 45,
        paddingBottom: 20,
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: THEME.border,
    },
    topBarTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: THEME.textMain,
        flex: 1,
        textAlign: 'center',
        fontFamily: 'Mitr_600SemiBold',
    },
    scrollContent: { padding: 20, paddingBottom: 40, flexGrow: 1, flex: Platform.OS === 'web' ? 1 : undefined },
    headerSection: { marginBottom: 20 },
    greetingTitle: {
        fontSize: 29,
        fontWeight: '600',
        color: THEME.textMain,
        fontFamily: 'Mitr_600SemiBold',
    },
    greetingSubtitle: {
        color: THEME.textSub,
        fontSize: 17,
        marginTop: 4,
        fontFamily: 'Mitr_400Regular',
    },
    dashboardCard: {
        flex: 1,
        backgroundColor: THEME.surface,
        borderRadius: 20,
        padding: 24,
        width: "100%",
        marginTop: 10,
        ...Platform.select({
            web: { boxShadow: "0px 4px 20px -2px rgba(99, 102, 241, 0.08)" },
            default: {
                elevation: 3,
                shadowColor: THEME.primary,
                shadowOpacity: 0.08,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
            },
        }),
    },
    controlsContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
    },
    // Wave animation
    waveContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        height: 40,
        marginBottom: 20,
        gap: 4,
    },
    waveBar: {
        width: 4,
        borderRadius: 2,
        backgroundColor: THEME.primary,
    },
    // Record button
    recordButton: {
        width: 90,
        height: 90,
        borderRadius: 45,
        borderWidth: 4,
        borderColor: THEME.border,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    recordingActive: {
        borderColor: THEME.danger + '40',
    },
    recordInner: {
        width: 70,
        height: 70,
        borderRadius: 35,
    },
    recordInnerActive: {
        borderRadius: 10,
        width: 36,
        height: 36,
    },
    controlLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: THEME.textSub,
        fontFamily: 'Mitr_400Regular',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: THEME.border,
    },
    dividerText: {
        marginHorizontal: 14,
        color: THEME.textMuted,
        fontWeight: '600',
        fontSize: 13,
        fontFamily: 'Mitr_500Medium',
    },
    // Upload button — outline style
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        padding: 16,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: THEME.primary,
        backgroundColor: 'transparent',
    },
    uploadButtonText: {
        fontWeight: 'bold',
        fontSize: 16,
        color: THEME.primary,
        fontFamily: 'Mitr_500Medium',
    },
    // ToS
    tosContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 20,
        paddingHorizontal: 4,
    },
    tosCheckbox: {
        marginRight: 8,
        marginTop: 2,
    },
    tosText: {
        flex: 1,
        fontSize: 13,
        color: THEME.textSub,
        lineHeight: 20,
        fontFamily: 'Mitr_400Regular',
    },
    tosLink: {
        color: THEME.primary,
        textDecorationLine: 'underline',
        fontFamily: 'Mitr_500Medium',
    },
    // Main button
    mainButton: {
        backgroundColor: THEME.primary,
        padding: 16,
        borderRadius: 16,
        alignItems: "center",
        ...Platform.select({
            web: { boxShadow: "0px 10px 15px -3px rgba(99, 102, 241, 0.25)" },
            default: {
                elevation: 4,
                shadowColor: THEME.primary,
                shadowOpacity: 0.25,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 4 },
            },
        }),
    },
    mainButtonText: {
        fontWeight: "bold",
        fontSize: 16,
        color: "#FFF",
        fontFamily: 'Mitr_500Medium',
    },
    secondaryButton: {
        padding: 16,
        borderRadius: 16,
        alignItems: "center",
        width: '100%',
    },
    secondaryButtonText: {
        fontWeight: "bold",
        fontSize: 16,
        color: THEME.textSub,
        fontFamily: 'Mitr_400Regular',
    },
    audioReadyContainer: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    audioIconWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    audioReadyText: {
        fontSize: 18,
        fontWeight: '700',
        color: THEME.textMain,
        marginBottom: 10,
        fontFamily: 'Mitr_600SemiBold',
    },
    titleInput: {
        width: '100%',
        borderWidth: 1,
        borderColor: THEME.border,
        borderRadius: 12,
        padding: 14,
        marginTop: 16,
        marginBottom: 4,
        backgroundColor: THEME.inputBg,
        fontSize: 15,
        color: THEME.textMain,
        fontFamily: 'Mitr_400Regular',
    },
    playButtonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
    },
    playText: {
        fontSize: 14,
        fontWeight: '600',
        color: THEME.primary,
        marginLeft: 8,
        fontFamily: 'Mitr_400Regular',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 50,
    },
    loadingText: {
        marginTop: 20,
        fontSize: 18,
        fontWeight: 'bold',
        color: THEME.textMain,
        fontFamily: 'Mitr_500Medium',
    },
    subLoadingText: {
        marginTop: 8,
        fontSize: 14,
        color: THEME.textSub,
        fontFamily: 'Mitr_400Regular',
    },
    editorContainer: {
        flex: 1,
    },
    inputLabel: {
        fontWeight: "700",
        marginBottom: 8,
        fontSize: 14,
        color: THEME.textMain,
        marginLeft: 4,
        fontFamily: 'Mitr_500Medium',
    },
    markdownWrapper: {
        flex: 1,
        backgroundColor: THEME.bg,
        borderWidth: 1,
        borderColor: THEME.border,
        borderRadius: 14,
        padding: 16,
        marginBottom: 20,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    exportButton: {
        flex: 1,
        backgroundColor: THEME.secondary,
        shadowColor: THEME.secondary,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalSheet: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        width: '90%',
        maxWidth: 500,
        maxHeight: '80%',
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: THEME.border,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: THEME.textMain,
        flex: 1,
        fontFamily: 'Mitr_600SemiBold',
    },
    tosModalBody: {
        fontSize: 15,
        lineHeight: 24,
        color: THEME.textSub,
        paddingVertical: 16,
        fontFamily: 'Mitr_400Regular',
    },
});

const markdownStyles = StyleSheet.create({
    body: { fontSize: 16, lineHeight: 28, color: THEME.textMain, fontFamily: 'Mitr_400Regular' },
    heading1: { fontSize: 24, fontWeight: 'bold', marginVertical: 10, color: THEME.primary, fontFamily: 'Mitr_600SemiBold' },
    heading2: { fontSize: 20, fontWeight: 'bold', marginVertical: 8, color: THEME.primaryDark, fontFamily: 'Mitr_600SemiBold' },
    strong: { fontWeight: 'bold', color: '#11181C' },
    blockquote: { borderLeftWidth: 4, borderLeftColor: '#ccc', paddingLeft: 10, opacity: 0.8 },
});
