import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import * as Print from 'expo-print';
import { useNavigation, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { getAccessToken } from '../../utils/token';
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
    primary: "#6C63FF", // Matches home.tsx
    primaryDark: "#5A52D5",
    secondary: "#10B981",
    danger: "#FF69B4",    // Matches home.tsx pink
    bg: "#F8FAFC",
    surface: "#FFFFFF",
    textMain: "#333333",
    textSub: "#666666",
    border: "#EEEEEE",
    inputBg: "#FFFFFF",
};

export default function TranscribeScreen() {
    const navigation = useNavigation();
    const router = useRouter();
    const notify = useNotification();

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

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        if (!AI_API_URL) return;
        try {
            const rawToken = await getAccessToken(); // ดึง JWT ของจริงมาใช้
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

    const handleSelectHistory = async (item: HistoryItem) => {
        if (item.status !== 'completed') {
            Alert.alert('Info', `This transcription is "${item.status}" and has no text yet.`);
            return;
        }
        // If the list already includes the text, load it immediately
        if (item.result_text && typeof item.result_text === 'string') {
            setResultText(item.result_text);
            setStatus('completed');
            return;
        }
        // Fallback: fetch full job details from the AI microservice
        try {
            const rawToken = await getAccessToken();
            const token = rawToken ? rawToken.replace(/^"|"$/g, '').trim() : null;
            if (!token) {
                Alert.alert('Auth Error', 'No valid session token. Please log in again.');
                return;
            }
            const jobId = item.job_id ?? item.id;
            const detailResponse = await fetch(`${AI_API_URL}/sheets/jobs/${jobId}`, {
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
            const rawToken = await getAccessToken(); // ดึง JWT ของจริงมาใช้
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

                    const pollToken = await getAccessToken();
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
            {/* Top Bar matching home.tsx layout */}
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => router.push('/(drawer)/home')}>
                    <Ionicons name="chevron-back" size={28} color="#333" />
                </TouchableOpacity>

                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333', flex: 1, textAlign: 'center' }}>
                    ถอดเสียง AI
                </Text>

                <TouchableOpacity onPress={() => notify("ฟีเจอร์นี้ให้ AI ถอดเสียงพร้อมสรุปเนื้อหาทันที! 🎤")}>
                    <Ionicons name="information-circle-outline" size={24} color="#333" />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex1}
            >
                <View style={styles.layoutWrapper}>
                    {/* LEFT / CENTER COLUMN */}
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Header Greeting */}
                        <View style={styles.headerSection}>
                            <Text style={styles.greetingTitle}>ถอดเสียงเลคเชอร์</Text>
                            <Text style={styles.greetingSubtitle}>อัดเสียงหรืออัปโหลดไฟล์ให้ AI ช่วยสรุปให้!</Text>
                        </View>

                        {/* Dashboard Content */}
                        <View style={styles.dashboardCard}>

                            {/* STATUS INDICATORS */}
                            {(status === 'uploading' || status === 'processing') ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color={THEME.primary} />
                                    <Text style={styles.loadingText}>{loadingMessage}</Text>
                                    <Text style={styles.subLoadingText}>This may take a few minutes. Please wait...</Text>
                                </View>
                            ) : status === 'completed' ? (
                                <View style={styles.editorContainer}>
                                    <Text style={styles.inputLabel}>Transcription Result</Text>
                                    <TextInput
                                        style={styles.textArea}
                                        multiline
                                        value={resultText}
                                        onChangeText={setResultText}
                                        placeholder="Transcription result will appear here..."
                                        textAlignVertical="top"
                                    />

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
                                            <View style={styles.audioIconWrapper}>
                                                <Ionicons name="document-text" size={40} color={THEME.primary} />
                                            </View>
                                            <Text style={styles.audioReadyText}>ไฟล์เสียงพร้อมแล้ว</Text>

                                            {/* --- CUSTOM LECTURE TITLE INPUT --- */}
                                            <TextInput
                                                style={styles.titleInput}
                                                placeholder="ตั้งชื่อเลกเชอร์ (เช่น Lecture 1: AI)..."
                                                placeholderTextColor={THEME.textSub}
                                                value={customTitle}
                                                onChangeText={setCustomTitle}
                                            />

                                            {/* --- PREVIEW AUDIO PLAYBACK --- */}
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
                                            {/* Record Button */}
                                            <TouchableOpacity
                                                style={[
                                                    styles.recordButton,
                                                    status === 'recording' && styles.recordingActive
                                                ]}
                                                onPress={status === 'recording' ? stopRecording : startRecording}
                                            >
                                                <View style={[
                                                    styles.recordInner,
                                                    status === 'recording' && styles.recordInnerActive
                                                ]} />
                                            </TouchableOpacity>
                                            <Text style={styles.controlLabel}>
                                                {status === 'recording' ? 'Tap to Stop Recording' : 'Tap to Start Recording'}
                                            </Text>

                                            <View style={styles.divider}>
                                                <View style={styles.dividerLine} />
                                                <Text style={styles.dividerText}>OR</Text>
                                                <View style={styles.dividerLine} />
                                            </View>

                                            {/* Upload Button */}
                                            <TouchableOpacity
                                                style={[styles.mainButton, { width: '100%', backgroundColor: THEME.surface, borderWidth: 1, borderColor: THEME.border }]}
                                                onPress={pickAudioFile}
                                            >
                                                <Text style={[styles.mainButtonText, { color: THEME.textMain }]}>Select Audio File</Text>
                                            </TouchableOpacity>
                                        </>
                                    )}
                                </View>
                            )}
                        </View>
                        <View style={{ height: 40 }} />
                    </ScrollView>

                    {/* RIGHT COLUMN: RECORD HISTORY */}
                    <View style={styles.sidebarColumn}>
                        <Text style={styles.sidebarTitle}>ประวัติการถอดเสียง</Text>
                        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                            {historyList.length === 0 && (
                                <Text style={{ color: THEME.textSub, fontSize: 13, textAlign: 'center', marginTop: 20 }}>ยังไม่มีประวัติการถอดเสียง</Text>
                            )}
                            {historyList.map(item => (
                                <TouchableOpacity
                                    key={item.id ?? item.job_id}
                                    style={styles.historyCard}
                                    onPress={() => handleSelectHistory(item)}
                                >
                                    <View style={styles.historyHeader}>
                                        <Text style={styles.historyItemTitle} numberOfLines={1}>{item.filename}</Text>
                                        <View style={[
                                            styles.historyBadge,
                                            item.status === 'completed' ? styles.badgeSuccess :
                                                (item.status === 'processing' || item.status === 'pending') ? styles.badgeProcessing : styles.badgeDanger
                                        ]}>
                                            <Text style={styles.historyBadgeText}>{item.status}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.historyFooter}>
                                        <Ionicons name="time-outline" size={14} color={THEME.textSub} />
                                        <Text style={styles.historyDateText}>{formatDate(item.created_at)}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    flex1: { flex: 1 },
    layoutWrapper: {
        flex: 1,
        flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    },
    sidebarColumn: {
        width: Platform.OS === 'web' ? 320 : '100%',
        backgroundColor: '#FFF',
        borderLeftWidth: Platform.OS === 'web' ? 1 : 0,
        borderTopWidth: Platform.OS === 'web' ? 0 : 1,
        borderColor: THEME.border,
        padding: 20,
    },
    sidebarTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: THEME.textMain,
        marginBottom: 16,
    },
    historyCard: {
        backgroundColor: THEME.bg,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: THEME.border,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    historyItemTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: THEME.textMain,
        flex: 1,
        marginRight: 8,
    },
    historyBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeSuccess: { backgroundColor: THEME.secondary + '20' },
    badgeProcessing: { backgroundColor: '#A78BFA20' },
    badgeDanger: { backgroundColor: THEME.danger + '20' },
    historyBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: THEME.textMain,
    },
    historyFooter: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    historyDateText: {
        fontSize: 12,
        color: THEME.textSub,
        marginLeft: 4,
    },
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    topBar: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFF', paddingTop: 45, paddingBottom: 20, justifyContent: 'space-between' },
    scrollContent: { padding: 20, paddingBottom: 40, flexGrow: 1, flex: Platform.OS === 'web' ? 1 : undefined },
    headerSection: { marginBottom: 20 },
    greetingTitle: { fontSize: 28, fontWeight: '900', color: '#6C63FF' },
    greetingSubtitle: { color: '#64748B', fontSize: 14, marginTop: 4 },
    dashboardCard: {
        backgroundColor: THEME.surface,
        borderRadius: 20,
        padding: 24,
        width: "100%",
        minHeight: 400,
        marginTop: 10,
        ...Platform.select({
            web: {
                boxShadow: "0px 4px 12px -2px rgba(0,0,0,0.05)",
            },
            default: {
                elevation: 2,
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowRadius: 8,
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
    recordButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        borderColor: THEME.border,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    recordingActive: {
        borderColor: THEME.danger + '40', // light red border
    },
    recordInner: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: THEME.primary,
    },
    recordInnerActive: {
        backgroundColor: THEME.danger,
        borderRadius: 8, // Square shape for stop
        width: 32,
        height: 32,
    },
    controlLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: THEME.textSub,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginVertical: 30,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: THEME.border,
    },
    dividerText: {
        marginHorizontal: 14,
        color: THEME.textSub,
        fontWeight: '600',
        fontSize: 13,
    },
    mainButton: {
        backgroundColor: THEME.primary,
        padding: 16,
        borderRadius: 16,
        alignItems: "center",
        ...Platform.select({
            web: { boxShadow: "0px 10px 15px -3px rgba(79, 70, 229, 0.2)" },
            default: {
                elevation: 4,
                shadowColor: THEME.primary,
                shadowOpacity: 0.2,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 4 },
            },
        }),
    },
    mainButtonText: {
        fontWeight: "bold",
        fontSize: 16,
        color: "#FFF",
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
        backgroundColor: '#EEF2FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    audioReadyText: {
        fontSize: 18,
        fontWeight: '700',
        color: THEME.textMain,
        marginBottom: 10,
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
    },
    subLoadingText: {
        marginTop: 8,
        fontSize: 14,
        color: THEME.textSub,
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
    },
    textArea: {
        backgroundColor: THEME.bg,
        borderWidth: 1,
        borderColor: THEME.border,
        borderRadius: 14,
        padding: 16,
        fontSize: 16,
        minHeight: 250,
        color: THEME.textMain,
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
    }
});
