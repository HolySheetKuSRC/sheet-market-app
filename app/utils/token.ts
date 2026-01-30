import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

/**
 * SAVE TOKEN
 */
export const saveTokens = async (
  accessToken: string,
  refreshToken?: string
) => {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      console.log('📂 [Storage: Web] Tokens saved to localStorage');
    } else {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
      if (refreshToken) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      }
      console.log('🔐 [Storage: Mobile] Tokens encrypted and saved via SecureStore');
    }
    // Log ดูบางส่วนของ Token เพื่อความมั่นใจ (ไม่ควร Log ตัวเต็มใน Production)
    console.log(`🎫 Access Token (prefix): ${accessToken.substring(0, 10)}...`);
  } catch (error) {
    console.error('❌ [Storage Error] Failed to save tokens:', error);
  }
};

/**
 * GET ACCESS TOKEN
 */
export const getAccessToken = async (): Promise<string | null> => {
  try {
    let token: string | null = null;
    
    if (Platform.OS === 'web') {
      token = localStorage.getItem(ACCESS_TOKEN_KEY);
    } else {
      token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    }

    if (token) {
      console.log('📖 [Storage] Access Token retrieved successfully');
    } else {
      console.log('⚠️ [Storage] No Access Token found');
    }
    
    return token;
  } catch (error) {
    console.error('❌ [Storage Error] Failed to get access token:', error);
    return null;
  }
};

/**
 * CLEAR TOKEN (LOGOUT)
 */
export const clearTokens = async (): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      console.log('🗑️ [Storage: Web] Tokens cleared from localStorage');
    } else {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      console.log('🗑️ [Storage: Mobile] Tokens deleted from SecureStore');
    }
  } catch (error) {
    console.error('❌ [Storage Error] Failed to clear tokens:', error);
  }
};

export const removeToken = clearTokens;