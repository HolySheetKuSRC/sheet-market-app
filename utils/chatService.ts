const CHAT_API_URL = process.env.EXPO_PUBLIC_CHAT_AI_URL;

export const sendMessageToAI = async (
  sessionId: string,
  message: string,
  sheetId: string | null = null
) => {
  try {
    if (!CHAT_API_URL) {
      console.error("❌ Missing EXPO_PUBLIC_CHAT_AI_URL in .env");
      return null;
    }

    const payload = {
      session_id: sessionId,
      message: message,
      sheet_id: sheetId === "" ? null : sheetId,
    };

    console.log("🚀 Sending to AI API");
    console.log("Payload:", payload);

    const response = await fetch(CHAT_API_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Chat API Error:", errorText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("🔥 Chat Service Fatal Error:", error);
    return null;
  }
};