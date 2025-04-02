// src/utils/notificationUtils.ts
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { getFCMToken, requestUserPermission } from "../../firebase";

// Configure default notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Register for push notifications
export const registerForPushNotificationsAsync = async () => {
  if (!Device.isDevice) {
    console.log("Must use physical device for Push Notifications");
    return null;
  }

  try {
    // For Android, request Firebase permission
    if (Platform.OS === "android") {
      const hasPermission = await requestUserPermission();
      if (!hasPermission) {
        console.log("User denied notification permission");
        return null;
      }
    }

    // For iOS, use Expo's permission request
    if (Platform.OS === "ios") {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission not granted for notifications");
        return null;
      }
    }

    // Get FCM token
    const token = await getFCMToken();
    console.log("Push token:", token);
    return token;
  } catch (error) {
    console.error("Error getting push token:", error);
    return null;
  }
};

// Schedule a local notification
export const scheduleLocalNotification = async (
  title: string,
  body: string,
  data = {}
) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null, // Immediate notification
  });
};
