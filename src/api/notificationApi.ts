import api from "./axios";

/**
 * Register device token for push notifications
 */
export const registerDeviceToken = async (token: string): Promise<boolean> => {
  try {
    await api.post("/notifications/register-device", { token });
    return true;
  } catch (error) {
    console.error("Error registering device token:", error);
    return false;
  }
};

/**
 * Remove device token
 */
export const removeDeviceToken = async (token: string): Promise<boolean> => {
  try {
    await api.post("/notifications/remove-device", { token });
    return true;
  } catch (error) {
    console.error("Error removing device token:", error);
    return false;
  }
};

/**
 * Update notification preferences
 */
export const updateNotificationPreferences = async (preferences: {
  moistureAlerts?: boolean;
  batteryAlerts?: boolean;
  wateringReminders?: boolean;
}): Promise<boolean> => {
  try {
    await api.post("/notifications/preferences", preferences);
    return true;
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return false;
  }
};

/**
 * Get notification preferences
 */
export const getNotificationPreferences = async () => {
  try {
    const response = await api.get("/notifications/preferences");
    return response.data.data.notificationPreferences;
  } catch (error) {
    console.error("Error getting notification preferences:", error);
    return null;
  }
};

/**
 * Send test notification
 */
export const sendTestNotification = async (): Promise<boolean> => {
  try {
    await api.post("/notifications/test");
    return true;
  } catch (error) {
    console.error("Error sending test notification:", error);
    return false;
  }
};
