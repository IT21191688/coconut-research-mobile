// src/context/NotificationContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "../api/axios";
import { useAuth } from "./AuthContext";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

interface NotificationContextType {
  pushToken: string;
  setPushToken: (token: string) => void;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
  sendTestNotification: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider: React.FC<{
  children: React.ReactNode;
  initialToken?: string;
}> = ({ children, initialToken = "" }) => {
  const [pushToken, setPushToken] = useState(initialToken);
  const [hasPermission, setHasPermission] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    checkPermissions();
  }, []);

  useEffect(() => {
    if (user && pushToken) {
      registerTokenWithServer();
    }
  }, [user, pushToken]);

  const checkPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setHasPermission(status === "granted");
    return status === "granted";
  };

  const requestPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setHasPermission(status === "granted");
    return status === "granted";
  };

  const registerTokenWithServer = async () => {
    try {
      if (!pushToken) return;

      await axios.post("/notifications/register-token", {
        token: pushToken,
        device: Platform.OS,
      });

      console.log("Push token registered with server");
    } catch (error) {
      console.error("Failed to register push token with server:", error);
    }
  };

  const sendTestNotification = async () => {
    try {
      await axios.post("/notifications/test-notification", {
        title: "Test Notification",
        body: "This is a test notification from your app!",
        data: { type: "test" },
      });
    } catch (error) {
      console.error("Failed to send test notification:", error);
      throw error;
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        pushToken,
        setPushToken,
        hasPermission,
        requestPermission,
        sendTestNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};
