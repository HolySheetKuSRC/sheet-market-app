import {
    clearTokens,
    getAccessToken,
    getRefreshToken,
    saveTokens,
} from "./token";

// ดึง URL จาก Environment
const API_URL = process.env.EXPO_PUBLIC_API_URL;

/**
 * ฟังก์ชันกลางสำหรับยิง API (ใช้แทน fetch ปกติ)
 * จะทำการ Refresh Token ให้เองถ้าเจอ 401
 * * @param endpoint - path ที่ต้องการยิง (เช่น /products) ไม่ต้องใส่ full url
 * @param options - options ของ fetch (method, body, etc.)
 */
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {},
) => {
  // 1. ดึง Access Token ปัจจุบันมาใส่ Header
  const token = await getAccessToken();

  const headers: any = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // 2. ยิง Request รอบแรก
  let response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // 3. 🔥 ดักจับ Error 401 (Token หมดอายุ)
  if (response.status === 401) {
    console.log("⚠️ Access Token หมดอายุ (401) กำลังขอใหม่...");

    const refreshToken = await getRefreshToken();

    if (refreshToken) {
      try {
        // 4. แอบยิงไปขอ Token ใหม่
        const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          const newAccessToken = data.access_token; // หรือ data.token ตามที่ backend ส่งมา

          // บางที Server อาจส่ง Refresh Token ตัวใหม่มาด้วย หรือไม่ส่งมา (ถ้าไม่ส่งให้ใช้ตัวเดิม)
          const newRefreshToken = data.refresh_token || refreshToken;

          // 5. บันทึก Token ใหม่ลงเครื่อง
          await saveTokens(newAccessToken, newRefreshToken);
          console.log("✅ Refresh Token สำเร็จ! กำลังยิง Request เดิมซ้ำ...");

          // 6. ยิง Request เดิมซ้ำอีกรอบด้วย Token ใหม่ (Retry)
          headers["Authorization"] = `Bearer ${newAccessToken}`;
          response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
          });
        } else {
          // ถ้า Refresh ไม่ผ่าน (เช่น Refresh Token ก็หมดอายุ) -> Logout
          console.log("❌ Refresh Token ไม่ผ่าน (ต้อง Login ใหม่)");
          await clearTokens();
          // ตรงนี้อาจจะเพิ่มโค้ด Redirect ไปหน้า Login ได้ (เช่น router.replace('/login'))
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
 * Send multipart/form-data requests (for file uploads).
 * This helper does NOT set a Content-Type header so the runtime can
 * automatically add the proper boundary. It still handles token refresh like apiRequest.
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

  // Ensure we do NOT set Content-Type here so fetch can add the boundary
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
          const newAccessToken = data.access_token;
          const newRefreshToken = data.refresh_token || refreshToken;

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
