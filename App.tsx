import React, { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";
import Toast from "react-native-toast-message";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
import "./src/i18n";
import messaging from "@react-native-firebase/messaging";
import { getApp } from "@react-native-firebase/app";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  // Setup FCM notifications properly
  async function setupNotifications() {
    try {
      // Register foreground handler
      const unsubscribe = messaging().onMessage(async (remoteMessage) => {
        console.log("A new FCM message arrived!", remoteMessage);

        // Determine if this is a moisture notification
        const isMoistureAlert =
          remoteMessage.data?.type === "low_moisture" ||
          remoteMessage.notification?.title
            ?.toLowerCase()
            .includes("moisture") ||
          remoteMessage.notification?.body?.toLowerCase().includes("moisture");

        // Show a toast notification with longer duration (40 seconds)
        if (remoteMessage.notification) {
          Toast.show({
            type: "info",
            text1: remoteMessage.notification.title || "New Notification",
            text2: remoteMessage.notification.body || "",
            visibilityTime: 40000, // 40 seconds in milliseconds
            autoHide: true,
            position: "top",
            topOffset: 60,

            // Style the toast container based on notification type
            style: {
              borderLeftWidth: 8,
              borderLeftColor: isMoistureAlert ? "#2196F3" : "#4CAF50",
              borderRadius: 12,
              marginHorizontal: 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 5,
              elevation: 8,
              backgroundColor: isMoistureAlert ? "#E3F2FD" : "#E8F5E9",
              padding: 4,
            },

            // Title styling
            text1Style: {
              fontSize: 17,
              fontWeight: "bold",
              color: isMoistureAlert ? "#0D47A1" : "#1B5E20",
              paddingTop: 4,
              paddingLeft: 8,
              paddingRight: 8,
            },

            // Message styling
            text2Style: {
              fontSize: 15,
              color: isMoistureAlert ? "#1565C0" : "#2E7D32",
              paddingBottom: 8,
              paddingLeft: 8,
              paddingRight: 8,
              lineHeight: 20,
            },
          });
        }
      });

      // Handle notifications that caused the app to open from background state
      messaging().onNotificationOpenedApp((remoteMessage) => {
        console.log(
          "Notification caused app to open from background state:",
          remoteMessage
        );
        // You can add navigation logic here if needed
      });

      // Check if app was opened from a notification when app was completely closed (quit state)
      try {
        const initialNotification = await messaging().getInitialNotification();
        if (initialNotification) {
          console.log(
            "Notification caused app to open from quit state:",
            initialNotification
          );
          // You can add navigation logic here if needed
        }
      } catch (error) {
        console.error("Error getting initial notification:", error);
      }

      // Request permission
      try {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          console.log("Authorization status:", authStatus);

          // Get FCM token - you'll need to store this on your server for the user
          try {
            const fcmToken = await messaging().getToken();
            console.log("FCM Token:", fcmToken);
            // You can store this token in AsyncStorage or pass it to your AuthContext
            // to send to your backend when the user logs in
          } catch (tokenError) {
            console.warn("Failed to get FCM token:", tokenError);
            // Continue without FCM token
          }
        }
      } catch (permissionError) {
        console.warn(
          "Failed to request notification permission:",
          permissionError
        );
      }

      // Return unsubscribe function to prevent memory leaks
      return unsubscribe;
    } catch (error) {
      console.error("Error setting up notifications:", error);
      // Return a no-op function in case of error
      return () => {};
    }
  }

  useEffect(() => {
    let unsubscribeNotifications: any = null;

    async function prepare() {
      try {
        console.log("Requesting user permission for notifications...");

        // Setup notifications
        unsubscribeNotifications = await setupNotifications();

        // Simulate loading time (you can remove this if it's just for visual effect)
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn("Error during app initialization:", e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();

    // Return cleanup function
    return () => {
      if (unsubscribeNotifications) {
        unsubscribeNotifications();
      }
    };
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      try {
        await SplashScreen.hideAsync();
      } catch (error) {
        console.warn("Error hiding splash screen:", error);
      }
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

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
