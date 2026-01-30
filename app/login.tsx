import axios from 'axios';
import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
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
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// 1. Import ฟังก์ชันจัดการ Token (ตรวจสอบ path ไฟล์ token.ts ของคุณด้วย)
import { saveTokens } from './utils/token';

/* ===============================
   ENV (สำคัญมากสำหรับ Expo Web)
================================ */
const AUTH_API_URL = process.env.EXPO_PUBLIC_AUTH_API_URL;

const THEME = {
  primary: '#4F46E5',
  primaryDark: '#3730A3',
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  textMain: '#0F172A',
  textSub: '#64748B',
  border: '#E2E8F0',
  inputBg: '#FFFFFF',
};

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  // --- States สำหรับ Form Data ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleTabChange = (mode: boolean) => {
    if (mode !== isLogin) {
      if (Platform.OS !== 'web') {
        Haptics.selectionAsync();
      }
      setIsLogin(mode);
    }
  };

  const handleAuthAction = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    if (!AUTH_API_URL) {
      Alert.alert('Config Error', 'AUTH_API_URL is not defined');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        // ---------- LOGIN ----------
        const response = await axios.post(
          `${AUTH_API_URL}/api/auth/login`,
          {
            email,
            password,
          }
        );

        console.log('Login Success:', response.data);

        // 2. ดึง token จาก response data (ใช้ชื่อ 'token' ตาม Log ที่คุณได้)
        const { token } = response.data;

        if (token) {
          // 3. เรียกใช้ saveTokens เพื่อเก็บลงเครื่อง (Log ในไฟล์ token.ts จะทำงานตรงนี้)
          await saveTokens(token);
        } else {
          console.warn('Login success but no token found in response');
        }

        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
          );
        }

        router.replace('/(drawer)/home' as any);

      } else {
        // ---------- REGISTER ----------
        if (password !== confirmPassword) {
          Alert.alert('Error', 'Passwords do not match!');
          setLoading(false);
          return;
        }

        const response = await axios.post(
          `${AUTH_API_URL}/api/auth/register`,
          {
            username,
            email,
            password,
            secPassword: confirmPassword,
          }
        );

        console.log('Register Success:', response.data);
        Alert.alert('Success', 'Account created successfully! Please Log In.');
        setIsLogin(true);
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        'Connection error. Please try again.';

      Alert.alert('Authentication Failed', errorMessage);

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Error
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex1}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.flex1}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.mainWrapper}>
            {/* Header */}
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }} />
              <TouchableOpacity
                onPress={() =>
                  Platform.OS !== 'web' &&
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                }
              >
                <Text style={styles.helpText}>Need help?</Text>
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View
              style={[
                styles.centeredContent,
                !isLogin && styles.registerMargin,
              ]}
            >
              <View style={styles.formConstraint}>
                <View style={styles.welcomeContainer}>
                  <Text style={styles.title}>
                    {isLogin ? 'Welcome Back!' : 'Join Us!'}
                  </Text>
                  <Text style={styles.subtitle}>
                    Access verified Thai university study guides & AI tools
                  </Text>
                </View>

                {/* Tabs */}
                <View style={styles.tabContainer}>
                  <TouchableOpacity
                    style={[
                      styles.tabButton,
                      isLogin && styles.activeTab,
                    ]}
                    onPress={() => handleTabChange(true)}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        isLogin && styles.activeTabText,
                      ]}
                    >
                      Log In
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.tabButton,
                      !isLogin && styles.activeTab,
                    ]}
                    onPress={() => handleTabChange(false)}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        !isLogin && styles.activeTabText,
                      ]}
                    >
                      Register
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Form */}
                <View style={styles.form}>
                  {!isLogin && (
                    <>
                      <View style={styles.dotContainer}>
                        <View style={[styles.dot, styles.activeDot]} />
                        <View style={styles.dot} />
                      </View>

                      <Text style={styles.inputLabel}>Username</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. Somchai_Inw"
                        placeholderTextColor="#94A3B8"
                        value={username}
                        onChangeText={setUsername}
                      />
                    </>
                  )}

                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="name@university.ac.th"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />

                  <Text style={styles.inputLabel}>Password</Text>
                  <TextInput
                    style={styles.input}
                    secureTextEntry
                    placeholder="••••••••"
                    placeholderTextColor="#94A3B8"
                    value={password}
                    onChangeText={setPassword}
                  />

                  {!isLogin && (
                    <>
                      <Text style={styles.inputLabel}>
                        Confirm Password
                      </Text>
                      <TextInput
                        style={styles.input}
                        secureTextEntry
                        placeholder="Repeat password"
                        placeholderTextColor="#94A3B8"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                      />
                    </>
                  )}

                  {isLogin && (
                    <TouchableOpacity>
                      <Text style={styles.forgotText}>
                        Forgot Password?
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.mainButton,
                      loading && { opacity: 0.8 },
                    ]}
                    onPress={handleAuthAction}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={styles.mainButtonText}>
                        {isLogin ? 'Sign In' : 'Create Account'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={{ height: 40 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ... styles เหมือนเดิม ...
const styles = StyleSheet.create({
  flex1: { flex: 1 },
  container: { flex: 1, backgroundColor: THEME.bg },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  mainWrapper: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: Platform.OS === 'android' ? 20 : 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
  },
  helpText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.textSub,
  },
  centeredContent: { alignItems: 'center', paddingVertical: 20 },
  registerMargin: { paddingTop: 10 },
  formConstraint: { width: '100%', maxWidth: 400 },
  welcomeContainer: { alignItems: 'center', marginBottom: 24 },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: THEME.textMain,
    letterSpacing: -0.5,
  },
  subtitle: {
    textAlign: 'center',
    color: THEME.textSub,
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 16,
    padding: 4,
    alignSelf: 'center',
    marginBottom: 24,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 36,
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: THEME.surface,
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 6px -1px rgba(0,0,0,0.1)',
      },
      default: {
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
    }),
  },
  tabText: {
    fontWeight: '700',
    color: THEME.textSub,
    fontSize: 14,
  },
  activeTabText: { color: THEME.primary },
  form: { width: '100%' },
  inputLabel: {
    fontWeight: '700',
    marginBottom: 6,
    fontSize: 14,
    color: THEME.textMain,
    marginLeft: 4,
  },
  input: {
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    marginBottom: 14,
    color: THEME.textMain,
  },
  forgotText: {
    textAlign: 'right',
    fontWeight: '700',
    marginBottom: 20,
    fontSize: 14,
    color: THEME.primary,
  },
  mainButton: {
    backgroundColor: THEME.primary,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
    ...Platform.select({
      web: {
        boxShadow:
          '0px 10px 15px -3px rgba(79, 70, 229, 0.3)',
      },
      default: {
        elevation: 4,
        shadowColor: THEME.primary,
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
    }),
  },
  mainButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#FFF',
  },
  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  dot: {
    width: 24,
    height: 6,
    backgroundColor: THEME.border,
    borderRadius: 3,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: THEME.primary,
    width: 36,
  },
});