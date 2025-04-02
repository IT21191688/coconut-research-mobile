// src/components/NotificationSettings.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
} from "react-native";
import * as Notifications from "expo-notifications";
import { sendTestNotification } from "../../api/notificationApi";
import { colors } from "../../constants/colors";
import Card from "../common/Card";
import { Ionicons } from "@expo/vector-icons";

const NotificationSettings = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setHasPermission(status === "granted");
  };

  const requestPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setHasPermission(status === "granted");
    return status === "granted";
  };

  const handlePermissionToggle = async (value: any) => {
    if (value) {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert(
          "Permission Required",
          "Please enable notifications in your device settings to receive alerts about water levels."
        );
      }
    }
  };

  const handleTestNotification = async () => {
    if (!hasPermission) {
      Alert.alert("Permission Needed", "Please enable notifications first");
      return;
    }

    setIsLoading(true);
    try {
      await sendTestNotification();
      Alert.alert("Test Sent", "Check your device for the test notification");
    } catch (error) {
      Alert.alert("Error", "Failed to send test notification");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card style={styles.container}>
      <Text style={styles.title}>Notification Settings</Text>

      <View style={styles.settingRow}>
        <View style={styles.labelContainer}>
          <Ionicons name="notifications-outline" size={22} color="#333" />
          <Text style={styles.label}>Enable Notifications</Text>
        </View>
        <Switch
          value={hasPermission}
          onValueChange={handlePermissionToggle}
          trackColor={{ false: "#ddd", true: colors.primary + "80" }}
          thumbColor={hasPermission ? colors.primary : "#999"}
        />
      </View>

      <View style={styles.infoContainer}>
        <Ionicons name="information-circle-outline" size={18} color="#666" />
        <Text style={styles.infoText}>
          You will receive notifications when soil moisture levels are low and
          watering is needed.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.testButton, isLoading && styles.disabledButton]}
        onPress={handleTestNotification}
        disabled={isLoading}
      >
        <Text style={styles.testButtonText}>
          {isLoading ? "Sending..." : "Test Notification"}
        </Text>
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fff",
    marginVertical: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  label: {
    fontSize: 16,
    color: "#333",
    marginLeft: 12,
  },
  infoContainer: {
    flexDirection: "row",
    backgroundColor: "#f0f8ff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  testButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  testButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});

export default NotificationSettings;
