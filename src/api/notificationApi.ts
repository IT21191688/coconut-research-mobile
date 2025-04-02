// src/api/notificationApi.ts
import api from "./axios";

// Register device token with server
export const registerDeviceToken = async (token: string, device: string) => {
  try {
    const response = await api.post("/notifications/register-token", {
      token,
      device,
    });
    return response.data;
  } catch (error) {
    console.error("Error registering device token:", error);
    throw error;
  }
};

// Unregister device token
export const unregisterDeviceToken = async (token: string) => {
  try {
    const response = await api.post("/notifications/unregister-token", {
      token,
    });
    return response.data;
  } catch (error) {
    console.error("Error unregistering device token:", error);
    throw error;
  }
};

// Send a test notification
export const sendTestNotification = async () => {
  try {
    const response = await api.post("/notifications/test-notification", {
      title: "Test Notification",
      body: "This is a test notification!",
    });
    return response.data;
  } catch (error) {
    console.error("Error sending test notification:", error);
    throw error;
  }
};
