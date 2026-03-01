import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const SESSION_TOKEN_KEY = "session_token"; // ✅ เพิ่มใหม่

/**
 * SAVE TOKEN
 */
export const saveTokens = async (
  accessToken: string,
  refreshToken?: string,
  sessionToken?: string, // ✅ เพิ่ม param แต่ไม่กระทบของเดิม
) => {
  try {
    if (Platform.OS === "web") {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      if (refreshToken)
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      if (sessionToken)
        localStorage.setItem(SESSION_TOKEN_KEY, sessionToken); // ✅ เพิ่ม
      console.log("📂 [Storage: Web] Tokens saved to localStorage");
    } else {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
      if (refreshToken) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      }
      if (sessionToken) {
        await SecureStore.setItemAsync(SESSION_TOKEN_KEY, sessionToken); // ✅ เพิ่ม
      }
      console.log(
        "🔐 [Storage: Mobile] Tokens encrypted and saved via SecureStore",
      );
    }
  } catch (error) {
    console.error("❌ [Storage Error] Failed to save tokens:", error);
  }
};

/**
 * GET ACCESS TOKEN
 */
export const getAccessToken = async (): Promise<string | null> => {
  try {
    if (Platform.OS === "web") {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    } else {
      return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    }
  } catch (error) {
    console.error("❌ [Storage Error] Failed to get access token:", error);
    return null;
  }
};

/**
 * GET REFRESH TOKEN
 */
export const getRefreshToken = async (): Promise<string | null> => {
  try {
    if (Platform.OS === "web") {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } else {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    }
  } catch (error) {
    console.error("❌ [Storage Error] Failed to get refresh token:", error);
    return null;
  }
};

/**
 * ✅ เพิ่มใหม่: GET SESSION TOKEN (JWT)
 */
export const getSessionToken = async (): Promise<string | null> => {
  try {
    if (Platform.OS === "web") {
      return localStorage.getItem(SESSION_TOKEN_KEY);
    } else {
      return await SecureStore.getItemAsync(SESSION_TOKEN_KEY);
    }
  } catch (error) {
    console.error("❌ [Storage Error] Failed to get session token:", error);
    return null;
  }
};

/**
 * CLEAR TOKENS (LOGOUT)
 */
export const clearTokens = async (): Promise<void> => {
  try {
    if (Platform.OS === "web") {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(SESSION_TOKEN_KEY); // ✅ เพิ่ม
    } else {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY); // ✅ เพิ่ม
    }
    console.log("🗑️ Tokens cleared successfully");
  } catch (error) {
    console.error("❌ [Storage Error] Failed to clear tokens:", error);
  }
};

/**
 * ❌ ของเดิม: getUserIdFromAccessToken (ไม่ใช้แล้ว แต่คงไว้)
 */
export const getUserIdFromAccessToken = async (): Promise<string | null> => {
  try {
    const token = await getAccessToken();
    if (!token) return null;

    const parts = token.split(".");
    if (parts.length < 2) return null;

    const payload = parts[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");

    const decoded = atob(base64);
    const obj = JSON.parse(decoded);

    return obj.sub || obj.userId || obj.id || null;
  } catch (error) {
    console.error("Failed to parse access token for user id", error);
    return null;
  }
};

/**
 * ✅ ตัวที่ควรใช้จริง: ดึง user id จาก SESSION TOKEN (JWT)
 */
export const getUserIdFromSessionToken = async (): Promise<string | null> => {
  try {
    const token = await getSessionToken();
    if (!token) {
      console.warn("⚠️ session_token is null");
      return null;
    }

    const parts = token.split(".");
    if (parts.length !== 3) {
      console.warn("⚠️ Invalid JWT format");
      return null;
    }

    let payload = parts[1];

    // ✅ base64url -> base64
    payload = payload.replace(/-/g, "+").replace(/_/g, "/");

    // ✅ เติม padding ถ้าขาด
    const pad = payload.length % 4;
    if (pad) {
      payload += "=".repeat(4 - pad);
    }

    const decoded =
      typeof atob !== "undefined"
        ? atob(payload)
        : Buffer.from(payload, "base64").toString("utf8");

    const obj = JSON.parse(decoded);

    console.log("🔎 Decoded JWT:", obj);

    return obj.user_id || obj.sub || null;
  } catch (error) {
    console.error("❌ Failed to decode session token", error);
    return null;
  }
};