import * as Haptics from 'expo-haptics';
import { Stack } from 'expo-router';
import React, { useState } from 'react';
import {
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

// --- Palette สีแบบ Modern Slate & Indigo ---
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

  const handleTabChange = (mode: boolean) => {
    if (mode !== isLogin) {
      if (Platform.OS !== 'web') {
        Haptics.selectionAsync();
      }
      setIsLogin(mode);
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
                onPress={() => Platform.OS !== 'web' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              >
                <Text style={styles.helpText}>Need help?</Text>
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={[styles.centeredContent, !isLogin && styles.registerMargin]}>
              <View style={styles.formConstraint}>
                {/* Welcome Section */}
                <View style={styles.welcomeContainer}>
                  <Text style={styles.title}>Welcome!</Text>
                  <Text style={styles.subtitle}>
                    Access verified Thai university study guides & AI tools
                  </Text>
                </View>

                {/* Tabs Section */}
                <View style={styles.tabContainer}>
                  <TouchableOpacity
                    style={[styles.tabButton, isLogin && styles.activeTab]}
                    onPress={() => handleTabChange(true)}
                  >
                    <Text style={[styles.tabText, isLogin && styles.activeTabText]}>Log In</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.tabButton, !isLogin && styles.activeTab]}
                    onPress={() => handleTabChange(false)}
                  >
                    <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>Register</Text>
                  </TouchableOpacity>
                </View>

                {/* คัดเลือกฟอร์มที่จะแสดง */}
                {isLogin ? <LoginForm /> : <RegisterForm />}
              </View>
            </View>
            
            {/* Footer Spacer - ดันเนื้อหาขึ้นตอนเปิดคีย์บอร์ด */}
            <View style={{ height: 40 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ---------------- Login Component ---------------- */
const LoginForm = () => {
  const handleLogin = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    console.log('Login attempt');
  };

  return (
    <View style={styles.form}>
      <Text style={styles.inputLabel}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="name@university.ac.th"
        placeholderTextColor="#94A3B8"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.inputLabel}>Password</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        placeholder="••••••••"
        placeholderTextColor="#94A3B8"
      />

      <TouchableOpacity onPress={() => Platform.OS !== 'web' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
        <Text style={styles.forgotText}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.mainButton} onPress={handleLogin}>
        <Text style={styles.mainButtonText}>Sign In</Text>
      </TouchableOpacity>

      <View style={styles.dividerRow}>
        <View style={styles.line} />
        <Text style={styles.orText}>Or continue with</Text>
        <View style={styles.line} />
      </View>

      <TouchableOpacity 
        style={styles.googleButton}
        onPress={() => Platform.OS !== 'web' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
      >
        <Text style={styles.googleButtonText}>Google</Text>
      </TouchableOpacity>
    </View>
  );
};

/* ---------------- Register Component ---------------- */
const RegisterForm = () => {
  const handleRegister = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    console.log('Register attempt');
  };

  return (
    <View style={styles.form}>
      <View style={styles.dotContainer}>
        <View style={[styles.dot, styles.activeDot]} />
        <View style={styles.dot} />
      </View>

      <Text style={styles.inputLabel}>Username</Text>
      <TextInput style={styles.input} placeholder="e.g. Somchai_Inw" placeholderTextColor="#94A3B8" />

      <Text style={styles.inputLabel}>Email</Text>
      <TextInput style={styles.input} placeholder="name@email.com" keyboardType="email-address"  placeholderTextColor="#94A3B8"/>

      <Text style={styles.inputLabel}>Password</Text>
      <TextInput style={styles.input} secureTextEntry placeholder="At least 8 characters" placeholderTextColor="#94A3B8"/>

      <Text style={styles.inputLabel}>Confirm Password</Text>
      <TextInput style={styles.input} secureTextEntry placeholder="Repeat password" placeholderTextColor="#94A3B8"/>

      <TouchableOpacity style={[styles.mainButton, { marginTop: 10 }]} onPress={handleRegister}>
        <Text style={styles.mainButtonText}>Create Account</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => Platform.OS !== 'web' && Haptics.selectionAsync()}>
        <Text style={styles.alreadyText}>Already have an account?</Text>
      </TouchableOpacity>
    </View>
  );
};

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
  flex1: { flex: 1 },
  container: { flex: 1, backgroundColor: THEME.bg },
  
  // จุดสำคัญ: ทำให้ ScrollView ยืดเต็มจอและจัดเนื้อหาไว้กลางจอ
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },

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

  centeredContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },

  registerMargin: {
    paddingTop: 10,
  },

  formConstraint: {
    width: '100%',
    maxWidth: 400,
  },

  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },

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
      web: { boxShadow: '0px 4px 6px -1px rgba(0,0,0,0.1)' },
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

  activeTabText: {
    color: THEME.primary,
  },

  form: {
    width: '100%',
  },

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

  alreadyText: {
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 16,
    fontSize: 14,
    color: THEME.textSub,
  },

  mainButton: {
    backgroundColor: THEME.primary,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0px 10px 15px -3px rgba(79, 70, 229, 0.3)' },
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

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: THEME.border,
  },

  orText: {
    marginHorizontal: 12,
    color: THEME.textSub,
    fontSize: 13,
    fontWeight: '600',
  },

  googleButton: {
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
  },

  googleButtonText: {
    fontWeight: '700',
    fontSize: 15,
    color: THEME.textMain,
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

  footerSpacer: {
    height: 20,
  },
});