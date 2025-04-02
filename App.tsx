// import React, { useCallback, useEffect, useState } from 'react';
// import { View } from 'react-native';
// import { SafeAreaProvider } from 'react-native-safe-area-context';
// import { NavigationContainer } from '@react-navigation/native';
// import { StatusBar } from 'expo-status-bar';
// import { AuthProvider, useAuth } from './src/context/AuthContext';
// import AppNavigator from './src/navigation/AppNavigator';
// import Toast from 'react-native-toast-message';
// import { GestureHandlerRootView } from 'react-native-gesture-handler';
// import * as SplashScreen from 'expo-splash-screen';
// import './src/i18n';

// // Keep the splash screen visible while we fetch resources
// SplashScreen.preventAutoHideAsync();

// export default function App() {
//   const [appIsReady, setAppIsReady] = useState(false);

//   useEffect(() => {
//     async function prepare() {
//       try {
//         await new Promise(resolve => setTimeout(resolve, 2000));
//       } catch (e) {
//         console.warn(e);
//       } finally {
//         setAppIsReady(true);
//       }
//     }

//     prepare();
//   }, []);

//   const onLayoutRootView = useCallback(async () => {
//     if (appIsReady) {
//       await SplashScreen.hideAsync();
//     }
//   }, [appIsReady]);

//   if (!appIsReady) {
//     return null;
//   }

//   return (
//     <GestureHandlerRootView style={{ flex: 1 }}>
//       <SafeAreaProvider>
//         <AuthProvider>
//           <NavigationContainer>
//             <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
//               <StatusBar style="dark" />
//               <AppNavigator />
//             </View>
//           </NavigationContainer>
//         </AuthProvider>
//         <Toast />
//       </SafeAreaProvider>
//     </GestureHandlerRootView>
//   );
// }

// import React, { useEffect, useRef, useState } from "react";
// import { Platform, View } from "react-native";
// import { SafeAreaProvider } from "react-native-safe-area-context";
// import { NavigationContainer } from "@react-navigation/native";
// import { StatusBar } from "expo-status-bar";
// import * as Notifications from "expo-notifications";
// import * as SplashScreen from "expo-splash-screen";
// import { AuthProvider } from "./src/context/AuthContext";
// import { registerForPushNotificationsAsync } from "./src/utils/notificationUtils";
// import { registerDeviceToken } from "./src/api/notificationApi";
// import AppNavigator from "./src/navigation/AppNavigator";
// import { GestureHandlerRootView } from "react-native-gesture-handler";
// import Toast from "react-native-toast-message";
// import firebase from "./firebase";
// import "./src/i18n";

// // Keep splash screen visible until ready
// SplashScreen.preventAutoHideAsync();

// export default function App() {
//   const [appIsReady, setAppIsReady] = useState(false);
//   const notificationListener: any = useRef();
//   const responseListener: any = useRef();

//   useEffect(() => {
//     async function prepare() {
//       try {
//         // Create notification channels for Android
//         if (Platform.OS === "android") {
//           // Create notification channels
//           const channelId = "default-channel-id";
//           const channelName = "Default Channel";

//           await Notifications.setNotificationChannelAsync(channelId, {
//             name: channelName,
//             importance: Notifications.AndroidImportance.MAX,
//             vibrationPattern: [0, 250, 250, 250],
//             lightColor: "#FF231F7C",
//           });

//           // You can add more channels for different notification types
//           await Notifications.setNotificationChannelAsync("watering-alerts", {
//             name: "Watering Alerts",
//             description: "Notifications about soil moisture and watering needs",
//             importance: Notifications.AndroidImportance.HIGH,
//             vibrationPattern: [0, 250, 250, 250],
//             lightColor: "#4BA3FF",
//           });
//         }

//         // Other initialization code...
//         // Register for push notifications, etc.
//       } catch (e) {
//         console.warn(e);
//       } finally {
//         setAppIsReady(true);
//       }
//     }

//     prepare();

//     // Clean up
//     return () => {
//       if (notificationListener.current) {
//         Notifications.removeNotificationSubscription(
//           notificationListener.current
//         );
//       }
//       if (responseListener.current) {
//         Notifications.removeNotificationSubscription(responseListener.current);
//       }
//     };
//   }, []);

//   const onLayoutRootView = async () => {
//     if (appIsReady) {
//       await SplashScreen.hideAsync();
//     }
//   };

//   if (!appIsReady) {
//     return null;
//   }

//   return (
//     <GestureHandlerRootView style={{ flex: 1 }}>
//       <SafeAreaProvider>
//         <AuthProvider>
//           <NavigationContainer>
//             <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
//               <StatusBar style="dark" />
//               <AppNavigator />
//             </View>
//           </NavigationContainer>
//         </AuthProvider>
//         <Toast />
//       </SafeAreaProvider>
//     </GestureHandlerRootView>
//   );
// }
import React, { useState, useEffect, useRef } from "react";
import { View, Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "./src/context/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";
import Toast from "react-native-toast-message";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import AsyncStorage from "@react-native-async-storage/async-storage";
import "./src/i18n";
import firebase, { getFCMToken, requestUserPermission } from "./firebase"; // Import the Firebase initialization

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState("");
  const notificationListener: any = useRef();
  const responseListener: any = useRef();

  useEffect(() => {
    async function prepare() {
      try {
        // Create notification channels for Android
        if (Platform.OS === "android") {
          // Create default notification channel
          await Notifications.setNotificationChannelAsync(
            "default-channel-id",
            {
              name: "Default Channel",
              importance: Notifications.AndroidImportance.MAX,
              vibrationPattern: [0, 250, 250, 250],
              lightColor: "#FF231F7C",
            }
          );

          // Create channel for watering alerts
          await Notifications.setNotificationChannelAsync("watering-alerts", {
            name: "Watering Alerts",
            description: "Notifications about soil moisture and watering needs",
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#4BA3FF",
          });

          // Create channel for device alerts
          await Notifications.setNotificationChannelAsync("device-alerts", {
            name: "Device Alerts",
            description: "Notifications about device status and battery",
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#FFA500",
          });
        }

        // Register for push notifications
        registerForPushNotificationsAsync().then((token) => {
          if (token) {
            setExpoPushToken(token);
            // Store token for later use after login
            AsyncStorage.setItem("pushToken", token);
            console.log("Push token:", token);
          }
        });

        // Set up notification listeners
        notificationListener.current =
          Notifications.addNotificationReceivedListener((notification) => {
            console.log("Notification received:", notification);
            // You can show a toast or in-app notification here
            Toast.show({
              type: "info",
              text1: notification.request.content.title || "",
              text2: notification.request.content.body || "",
              position: "top",
              visibilityTime: 4000,
            });
          });

        responseListener.current =
          Notifications.addNotificationResponseReceivedListener((response) => {
            console.log("Notification response:", response);
            // Handle notification tap here
            const data = response.notification.request.content.data;
            handleNotificationResponse(response);
          });

        // Add a delay to simulate loading resources
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();

    return () => {
      // Clean up the listeners
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const onLayoutRootView = async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  };

  if (!appIsReady) {
    return null;
  }

  // Helper function to handle notification responses
  const handleNotificationResponse = (response: any) => {
    const data = response.notification.request.content.data;

    // Handle different notification types
    if (data?.type === "low_moisture") {
      // Navigate to appropriate screen or take action
      console.log("Low moisture notification tapped:", data);
      // Example: navigate to device details
      // navigation.navigate('DeviceDetails', { deviceId: data.deviceId });
    } else if (data?.type === "low_battery") {
      console.log("Low battery notification tapped:", data);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <NavigationContainer>
            <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
              <StatusBar style="dark" />
              <AppNavigator />
            </View>
          </NavigationContainer>
        </AuthProvider>
        <Toast />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// Helper function to register for push notifications
async function registerForPushNotificationsAsync() {
  let token;

  if (Device.isDevice) {
    // For iOS devices, use Expo's notification permission system
    if (Platform.OS === "ios") {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("Failed to get push token for push notification!");
        return;
      }
    }

    // For Android, Firebase permissions are handled by the Firebase SDK

    try {
      // Use Firebase SDK to get FCM token
      if (Platform.OS === "android") {
        const hasPermission = await requestUserPermission();
        if (hasPermission) {
          token = await getFCMToken();
        } else {
          console.log("User has not granted notification permission");
        }
      } else {
        // For iOS, use Expo's token
        token = (await Notifications.getExpoPushTokenAsync()).data;
      }
    } catch (error) {
      console.error("Error getting push token:", error);
    }
  } else {
    console.log("Must use physical device for Push Notifications");
  }

  return token;
}
