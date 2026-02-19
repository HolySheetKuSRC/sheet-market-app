import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

/**
 * SAVE TOKEN
 */
export const saveTokens = async (
  accessToken: string,
  refreshToken?: string,
) => {
  try {
    if (Platform.OS === "web") {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      console.log("📂 [Storage: Web] Tokens saved to localStorage");
    } else {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
      if (refreshToken) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
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
    let token: string | null = null;

    if (Platform.OS === "web") {
      token = localStorage.getItem(ACCESS_TOKEN_KEY);
    } else {
      token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    }
    return token;
  } catch (error) {
    console.error("❌ [Storage Error] Failed to get access token:", error);
    return null;
  }
};

/**
 * ✅ [เพิ่มใหม่] GET REFRESH TOKEN
 */
export const getRefreshToken = async (): Promise<string | null> => {
  try {
    let token: string | null = null;

    if (Platform.OS === "web") {
      token = localStorage.getItem(REFRESH_TOKEN_KEY);
    } else {
      token = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    }
    return token;
  } catch (error) {
    console.error("❌ [Storage Error] Failed to get refresh token:", error);
    return null;
  }
};

/**
 * ✅ [เพิ่มใหม่] CLEAR TOKENS (LOGOUT)
 */
export const clearTokens = async (): Promise<void> => {
  try {
    if (Platform.OS === "web") {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } else {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    }
    console.log("🗑️ Tokens cleared successfully");
  } catch (error) {
    console.error("❌ [Storage Error] Failed to clear tokens:", error);
  }
};

/**
 * Try to extract the user id from the access token (JWT).
 * Returns `sub` or `userId` or `id` claim if present.
 */
export const getUserIdFromAccessToken = async (): Promise<string | null> => {
  try {
    const token = await getAccessToken();
    if (!token) return null;

    const parts = token.split(".");
    if (parts.length < 2) return null;

    const payload = parts[1];
    // base64url -> base64
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    let json = "";

    try {
      // atob should exist in web and many RN environments
      const decoded = atob(base64);
      json = decodeURIComponent(
        decoded
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      );
    } catch (e) {
      // fallback for environments without atob
      const buff = Buffer ? Buffer.from(base64, "base64").toString("utf8") : "";
      json = buff;
    }

    const obj = JSON.parse(json);
    return obj.sub || obj.userId || obj.id || null;
  } catch (error) {
    console.error("Failed to parse access token for user id", error);
    return null;
  }
};
