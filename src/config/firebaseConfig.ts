import messaging from "@react-native-firebase/messaging";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform, Alert } from "react-native";
import { registerDeviceToken, removeDeviceToken } from "../api/notificationApi";

export const initializeFirebaseMessaging = async () => {
  try {
    // Request permission for iOS
    if (Platform.OS === "ios") {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.log("Notification permission denied");
        return false;
      }
    }

    // Get FCM token
    const fcmToken = await messaging().getToken();
    if (fcmToken) {
      console.log("FCM Token:", fcmToken);
      await AsyncStorage.setItem("fcmToken", fcmToken);

      // Register token with your backend
      await registerDeviceToken(fcmToken);
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error initializing Firebase Messaging:", error);
    return false;
  }
};

export const setupFCMListeners = () => {
  // Handle notifications when app is in foreground
  const unsubscribeOnMessage = messaging().onMessage(async (remoteMessage) => {
    console.log("Notification received in foreground:", remoteMessage);

    // Show alert for foreground notifications
    if (remoteMessage.notification) {
      Alert.alert(
        remoteMessage.notification.title || "New Notification",
        remoteMessage.notification.body || "You have a new notification"
      );
    }
  });

  // Handle notification when app was in background/terminated and opened by tapping notification
  const unsubscribeOnNotificationOpened = messaging().onNotificationOpenedApp(
    (remoteMessage) => {
      console.log(
        "Notification opened app from background state:",
        remoteMessage
      );
      // Here you can navigate to specific screens based on notification data
      // e.g., if (remoteMessage.data?.type === 'device_alert') { navigate to device screen }
    }
  );

  // Check if app was opened from a notification when closed (terminated state)
  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        console.log(
          "Notification opened app from terminated state:",
          remoteMessage
        );
        // Handle navigation based on notification data
      }
    });

  // Handle token refresh
  const unsubscribeOnTokenRefresh = messaging().onTokenRefresh(
    async (fcmToken) => {
      console.log("FCM Token refreshed:", fcmToken);
      await AsyncStorage.setItem("fcmToken", fcmToken);
      await registerDeviceToken(fcmToken);
    }
  );

  // Return cleanup function
  return () => {
    unsubscribeOnMessage();
    unsubscribeOnNotificationOpened();
    unsubscribeOnTokenRefresh();
  };
};

export const unregisterFCMToken = async () => {
  try {
    const fcmToken = await AsyncStorage.getItem("fcmToken");
    if (fcmToken) {
      await removeDeviceToken(fcmToken);
      await AsyncStorage.removeItem("fcmToken");
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error unregistering FCM token:", error);
    return false;
  }
};
