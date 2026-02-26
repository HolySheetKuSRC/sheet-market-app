const CHAT_API_URL = process.env.EXPO_PUBLIC_CHAT_AI_URL;

/**
 * ส่งข้อความหา AI ผ่าน URL จาก .env
 */
export const sendMessageToAI = async (sessionId: string, message: string, sheetId: string = "") => {
  try {
    // ตรวจสอบว่ามี URL ใน env หรือไม่
    if (!CHAT_API_URL) {
      console.error("❌ Missing EXPO_PUBLIC_CHAT_AI_URL in .env");
      return null;
    }

    const response = await fetch(CHAT_API_URL, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session_id: sessionId,
        message: message,
        sheet_id: sheetId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("❌ Chat API Error Response:", errorData);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("🔥 Chat Service Fatal Error:", error);
    return null;
  }
};