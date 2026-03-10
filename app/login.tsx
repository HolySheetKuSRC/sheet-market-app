import axios from "axios";
import * as Haptics from "expo-haptics";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { saveTokens } from "../utils/token";

import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";

WebBrowser.maybeCompleteAuthSession();

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const GOOGLE_CLIENT_ID =
  "657352686440-of813ues4uubhm85i56rp73c7b68ammr.apps.googleusercontent.com";

const THEME = {
  primary: "#4F46E5",
  bg: "#F8FAFC",
  surface: "#FFFFFF",
  textMain: "#0F172A",
  textSub: "#64748B",
  border: "#E2E8F0",
};

export default function AuthScreen() {
  const router = useRouter();

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [username, setUsername] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  /* ---------------- GOOGLE AUTH ---------------- */

  // const redirectUri = AuthSession.makeRedirectUri({
  // });

  // console.log("Redirect URI:", redirectUri);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_CLIENT_ID,
    iosClientId: GOOGLE_CLIENT_ID,
    androidClientId: GOOGLE_CLIENT_ID,
    scopes: ["profile", "email"],
    responseType: "id_token",
  });

  useEffect(() => {
    if (response?.type === "success") {

      const idToken = response.params?.id_token;

      console.log("ID TOKEN:", idToken);

      if (idToken) {
        handleGoogleBackend(idToken);
      } else {
        Alert.alert("Google login failed");
      }
    }
  }, [response]);

  const handleGoogleBackend = async (idToken: string) => {
    try {
      setGoogleLoading(true);

      const res = await axios.post(`${API_URL}/auth/google-login`, {
        idToken,
      });

      const accessToken = res.data.access_token;
      const refreshToken = res.data.refresh_token;
      const sessionToken = res.data.session_token;

      await saveTokens(accessToken, refreshToken, sessionToken);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      router.replace("/(drawer)/home" as any);
    } catch (error) {
      console.error(error);
      Alert.alert("Google login failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      if (!request) return;

      setGoogleLoading(true);

      const result = await promptAsync({
      });

      console.log("Google result:", result);
    } catch (error) {
      console.error(error);
      Alert.alert("Google login error");
    } finally {
      setGoogleLoading(false);
    }
  };

  /* ---------------- EMAIL LOGIN ---------------- */

  const handleAuthAction = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    if (!API_URL) {
      Alert.alert("Config Error", "API URL missing");
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const res = await axios.post(`${API_URL}/auth/login`, {
          email,
          password,
        });

        const accessToken = res.data.access_token;
        const refreshToken = res.data.refresh_token;
        const sessionToken = res.data.session_token;

        await saveTokens(accessToken, refreshToken, sessionToken);

        router.replace("/(drawer)/home" as any);
      } else {
        if (password !== confirmPassword) {
          Alert.alert("Passwords do not match");
          setLoading(false);
          return;
        }

        await axios.post(`${API_URL}/auth/register`, {
          username,
          email,
          password,
          secPassword: confirmPassword,
        });

        Alert.alert("Success", "Account created");
        setIsLogin(true);
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Connection error. Please try again.";

      Alert.alert("Authentication Failed", message);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.form}>
            <Text style={styles.title}>
              {isLogin ? "Welcome Back" : "Create Account"}
            </Text>

            {!isLogin && (
              <TextInput
                placeholder="Username"
                style={styles.input}
                value={username}
                onChangeText={setUsername}
              />
            )}

            <TextInput
              placeholder="Email"
              style={styles.input}
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <TextInput
              placeholder="Password"
              style={styles.input}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            {!isLogin && (
              <TextInput
                placeholder="Confirm Password"
                style={styles.input}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            )}

            <TouchableOpacity
              style={styles.mainButton}
              onPress={handleAuthAction}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {isLogin ? "Sign In" : "Register"}
                </Text>
              )}
            </TouchableOpacity>

            {/* GOOGLE BUTTON */}

            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleLogin}
              disabled={!request || googleLoading}
            >
              {googleLoading ? (
                <ActivityIndicator />
              ) : (
                <Text style={styles.googleText}>Continue with Google</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
              <Text style={styles.switchText}>
                {isLogin
                  ? "Don't have an account? Register"
                  : "Already have account? Login"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ---------------- STYLE ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },

  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 32,
  },

  form: {
    width: "100%",
  },

  title: {
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 30,
    color: THEME.textMain,
    textAlign: "center",
  },

  input: {
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
  },

  mainButton: {
    backgroundColor: THEME.primary,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  googleButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 12,
    backgroundColor: "#fff",
  },

  googleText: {
    fontWeight: "600",
  },

  switchText: {
    textAlign: "center",
    marginTop: 20,
    color: "#555",
  },
});