import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from "./token";

// ดึง URL จาก Environment
const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {},
) => {
  const token = await getAccessToken();

  const headers: any = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    console.log("⚠️ Access Token หมดอายุ (401) กำลังขอใหม่...");

    const refreshToken = await getRefreshToken();

    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          
          // 🔥 แก้ไขจุดนี้: รองรับทั้ง access_token และ accessToken (ตามที่ Spring Boot มักจะส่ง)
          const newAccessToken = data.access_token || data.accessToken; 
          const newRefreshToken = data.refresh_token || data.refreshToken || refreshToken;

          if (newAccessToken) {
            await saveTokens(newAccessToken, newRefreshToken);
            console.log("✅ Refresh Token สำเร็จ! กำลังยิง Request เดิมซ้ำ...");

            headers["Authorization"] = `Bearer ${newAccessToken}`;
            response = await fetch(`${API_URL}${endpoint}`, {
              ...options,
              headers,
            });
          } else {
            console.log("❌ ไม่พบ Access Token ใน Response");
            await clearTokens();
          }
        } else {
          console.log("❌ Refresh Token ไม่ผ่าน (ต้อง Login ใหม่)");
          await clearTokens();
        }
      } catch (error) {
        console.error("Refresh Logic Error:", error);
        await clearTokens();
      }
    } else {
      console.log("❌ ไม่พบ Refresh Token ในเครื่อง");
      await clearTokens();
    }
  }

  return response;
};

/**
 * apiMultipartRequest (เหมือนด้านบน ปรับแค่ชื่อฟิลด์ access_token)
 */
export const apiMultipartRequest = async (
  endpoint: string,
  formData: FormData,
  options: RequestInit = {},
) => {
  const token = await getAccessToken();

  const headers: any = {
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (headers["Content-Type"]) delete headers["Content-Type"];

  let response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    body: formData,
  });

  if (response.status === 401) {
    const refreshToken = await getRefreshToken();

    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          // 🔥 แก้ไขจุดนี้ให้เหมือนกัน
          const newAccessToken = data.access_token || data.accessToken;
          const newRefreshToken = data.refresh_token || data.refreshToken || refreshToken;

          if (newAccessToken) {
            await saveTokens(newAccessToken, newRefreshToken);
            headers["Authorization"] = `Bearer ${newAccessToken}`;
            response = await fetch(`${API_URL}${endpoint}`, {
              ...options,
              headers,
              body: formData,
            });
          } else {
            await clearTokens();
          }
        } else {
          await clearTokens();
        }
      } catch (error) {
        console.error("Refresh Logic Error:", error);
        await clearTokens();
      }
    } else {
      await clearTokens();
    }
  }

  return response;
};