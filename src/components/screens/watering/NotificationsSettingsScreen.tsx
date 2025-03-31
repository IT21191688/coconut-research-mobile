import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { colors } from "react-native-elements";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  sendTestNotification,
} from "../../../api/notificationApi";

const NotificationSettingsScreen = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    moistureAlerts: true,
    batteryAlerts: true,
    wateringReminders: true,
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setIsLoading(true);
    try {
      const prefs = await getNotificationPreferences();
      if (prefs) {
        setPreferences(prefs);
      }
    } catch (error) {
      console.error("Error loading notification preferences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      const success = await updateNotificationPreferences(preferences);
      if (success) {
        Alert.alert(
          "Success",
          "Notification preferences updated successfully."
        );
      } else {
        Alert.alert("Error", "Failed to update notification preferences.");
      }
    } catch (error) {
      console.error("Error saving notification preferences:", error);
      Alert.alert("Error", "Failed to update notification preferences.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      setIsLoading(true);
      const success = await sendTestNotification();
      if (success) {
        Alert.alert(
          "Success",
          "Test notification sent. You should receive it shortly."
        );
      } else {
        Alert.alert("Error", "Failed to send test notification.");
      }
    } catch (error) {
      console.error("Error sending test notification:", error);
      Alert.alert("Error", "Failed to send test notification.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading preferences...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Preferences</Text>

        <View style={styles.preference}>
          <Text style={styles.preferenceText}>Moisture Alerts</Text>
          <Switch
            value={preferences.moistureAlerts}
            onValueChange={(value) =>
              setPreferences({ ...preferences, moistureAlerts: value })
            }
            trackColor={{ false: colors.gray300, true: colors.primaryLight }}
            thumbColor={
              preferences.moistureAlerts ? colors.primary : colors.gray500
            }
          />
        </View>

        <View style={styles.preference}>
          <Text style={styles.preferenceText}>Battery Alerts</Text>
          <Switch
            value={preferences.batteryAlerts}
            onValueChange={(value) =>
              setPreferences({ ...preferences, batteryAlerts: value })
            }
            trackColor={{ false: colors.gray300, true: colors.primaryLight }}
            thumbColor={
              preferences.batteryAlerts ? colors.primary : colors.gray500
            }
          />
        </View>

        <View style={styles.preference}>
          <Text style={styles.preferenceText}>Watering Reminders</Text>
          <Switch
            value={preferences.wateringReminders}
            onValueChange={(value) =>
              setPreferences({ ...preferences, wateringReminders: value })
            }
            trackColor={{ false: colors.gray300, true: colors.primaryLight }}
            thumbColor={
              preferences.wateringReminders ? colors.primary : colors.gray500
            }
          />
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSavePreferences}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Save Preferences</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.testButton}
          onPress={handleTestNotification}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Send Test Notification</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textPrimary,
  },
  section: {
    margin: 16,
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 16,
  },
  preference: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  preferenceText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  buttonContainer: {
    padding: 16,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  testButton: {
    backgroundColor: colors.info,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default NotificationSettingsScreen;
