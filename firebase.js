// import { initializeApp } from "@react-native-firebase/app";
// import messaging from "@react-native-firebase/messaging";

// // Initialize Firebase - config will be read from google-services.json
// const app = initializeApp();

// export const requestUserPermission = async () => {
//   const authStatus = await messaging().requestPermission();
//   const enabled =
//     authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
//     authStatus === messaging.AuthorizationStatus.PROVISIONAL;

//   if (enabled) {
//     console.log("Authorization status:", authStatus);
//     return true;
//   }
//   return false;
// };

// export const getFCMToken = async () => {
//   try {
//     await messaging().registerDeviceForRemoteMessages();
//     const token = await messaging().getToken();
//     console.log("FCM Token:", token);
//     return token;
//   } catch (error) {
//     console.error("Error getting FCM token:", error);
//     throw error;
//   }
// };

// export default app;
import firebase from "@react-native-firebase/app";
import messaging from "@react-native-firebase/messaging";
import { Platform } from "react-native";

// Firebase is already initialized from the google-services.json file
// No need to pass config manually - the native module handles this

// Request user permission for notifications
export const requestUserPermission = async () => {
  if (Platform.OS === "ios") {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    return enabled;
  } else {
    // For Android, permission is granted by default with the right AndroidManifest settings
    return true;
  }
};

// Get the FCM token
export const getFCMToken = async () => {
  try {
    const fcmToken = await messaging().getToken();
    console.log("FCM Token:", fcmToken);
    return fcmToken;
  } catch (error) {
    console.error("Error getting FCM token:", error);
    return null;
  }
};

// Set up background message handler
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log("Message handled in the background!", remoteMessage);
});

// Set up foreground message handler
export const setupForegroundMessageHandler = () => {
  const unsubscribe = messaging().onMessage(async (remoteMessage) => {
    console.log("Foreground message received:", remoteMessage);
    return remoteMessage;
  });

  return unsubscribe;
};

export default firebase;
