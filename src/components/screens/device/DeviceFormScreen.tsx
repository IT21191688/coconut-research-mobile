import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import {
  registerDevice,
  updateDevice,
  getDeviceById,
} from "../../../api/deviceApi";
import { Device } from "../../../types";
import Input from "../../common/Input";
import Button from "../../common/Button";
import { colors } from "../../../constants/colors";

type DeviceFormScreenRouteProp = RouteProp<
  {
    DeviceForm: {
      mode: "create" | "edit";
      deviceId?: string;
      deviceData?: Device;
    };
  },
  "DeviceForm"
>;

const deviceTypes = [
  { value: "soil_sensor", label: "Soil Sensor" },
  { value: "weather_station", label: "Weather Station" },
  { value: "irrigation_controller", label: "Irrigation Controller" },
];

const DeviceFormScreen: React.FC = () => {
  // Form state
  const [deviceId, setDeviceId] = useState("");
  const [deviceType, setDeviceType] = useState(deviceTypes[0].value);
  const [showDeviceTypePicker, setShowDeviceTypePicker] = useState(false);
  const [firmware, setFirmware] = useState("1.0.0");
  const [isActive, setIsActive] = useState(true);
  const [readingInterval, setReadingInterval] = useState("30");
  const [reportingInterval, setReportingInterval] = useState("60");
  const [moistureThreshold, setMoistureThreshold] = useState("30");
  const [temperatureThreshold, setTemperatureThreshold] = useState("35");
  const [humidityThreshold, setHumidityThreshold] = useState("70");
  const [batteryLevel, setBatteryLevel] = useState("100");

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  const navigation = useNavigation();
  const route = useRoute<DeviceFormScreenRouteProp>();
  const { mode, deviceId: routeDeviceId, deviceData } = route.params;

  useEffect(() => {
    if (mode === "edit") {
      if (deviceData) {
        setFormDataFromDevice(deviceData);
      } else if (routeDeviceId) {
        loadDeviceData(routeDeviceId);
      }
    }
  }, [mode, routeDeviceId, deviceData]);

  const loadDeviceData = async (id: string) => {
    try {
      setIsLoading(true);
      const device = await getDeviceById(id);
      setFormDataFromDevice(device);
    } catch (error) {
      console.error("Failed to load device data:", error);
      Alert.alert(
        "Error",
        "Failed to load device data. Please try again later."
      );
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const setFormDataFromDevice = (device: Device) => {
    setDeviceId(device.deviceId);
    setDeviceType(device.type);
    //setFirmware(device.firmware);
    setIsActive(device.status === "active");
    setReadingInterval(device.settings?.readingInterval?.toString() || "30");
    setReportingInterval(
      device.settings?.reportingInterval?.toString() || "60"
    );

    if (device.settings?.thresholds) {
      setMoistureThreshold(
        device.settings.thresholds.moisture?.toString() || "30"
      );
      setTemperatureThreshold(
        device.settings.thresholds.temperature?.toString() || "35"
      );
      setHumidityThreshold(
        device.settings.thresholds.humidity?.toString() || "70"
      );
    }

    if (device.batteryLevel) {
      setBatteryLevel(device.batteryLevel.toString());
    }

    // Show advanced settings if they were configured
    if (
      device.settings?.thresholds?.moisture ||
      device.settings?.thresholds?.temperature ||
      device.settings?.thresholds?.humidity
    ) {
      setShowAdvancedSettings(true);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Device ID validation
    if (!deviceId) {
      newErrors.deviceId = "Device ID is required";
    } else if (deviceId.length < 3) {
      newErrors.deviceId = "Device ID must be at least 3 characters";
    }

    // Firmware validation
    if (!firmware) {
      newErrors.firmware = "Firmware version is required";
    }

    // Interval validations
    if (!readingInterval || isNaN(Number(readingInterval))) {
      newErrors.readingInterval = "Reading interval must be a number";
    } else if (Number(readingInterval) < 1 || Number(readingInterval) > 1440) {
      newErrors.readingInterval =
        "Reading interval must be between 1 and 1440 minutes";
    }

    if (!reportingInterval || isNaN(Number(reportingInterval))) {
      newErrors.reportingInterval = "Reporting interval must be a number";
    } else if (
      Number(reportingInterval) < 1 ||
      Number(reportingInterval) > 1440
    ) {
      newErrors.reportingInterval =
        "Reporting interval must be between 1 and 1440 minutes";
    }

    // Advanced settings validation (only if visible)
    if (showAdvancedSettings) {
      if (
        moistureThreshold &&
        (!isNumeric(moistureThreshold) ||
          Number(moistureThreshold) < 0 ||
          Number(moistureThreshold) > 100)
      ) {
        newErrors.moistureThreshold =
          "Moisture threshold must be between 0 and 100";
      }

      if (
        temperatureThreshold &&
        (!isNumeric(temperatureThreshold) ||
          Number(temperatureThreshold) < -50 ||
          Number(temperatureThreshold) > 100)
      ) {
        newErrors.temperatureThreshold =
          "Temperature threshold must be between -50 and 100°C";
      }

      if (
        humidityThreshold &&
        (!isNumeric(humidityThreshold) ||
          Number(humidityThreshold) < 0 ||
          Number(humidityThreshold) > 100)
      ) {
        newErrors.humidityThreshold =
          "Humidity threshold must be between 0 and 100%";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      const deviceData:any = {
        deviceId,
        type: deviceType,
        firmware,
        status: isActive ? "active" : "inactive",
        settings: {
          readingInterval: Number(readingInterval),
          reportingInterval: Number(reportingInterval),
          thresholds: showAdvancedSettings
            ? {
                moisture: moistureThreshold
                  ? Number(moistureThreshold)
                  : undefined,
                temperature: temperatureThreshold
                  ? Number(temperatureThreshold)
                  : undefined,
                humidity: humidityThreshold
                  ? Number(humidityThreshold)
                  : undefined,
              }
            : undefined,
        },
        batteryLevel: Number(batteryLevel),
      };

      if (mode === "create") {
        await registerDevice(deviceData);
        Alert.alert("Success", "Device registered successfully!");
      } else {
        await updateDevice(routeDeviceId || deviceId, deviceData);
        Alert.alert("Success", "Device updated successfully!");
      }

      navigation.goBack();
    } catch (error) {
      console.error("Failed to save device:", error);
      Alert.alert(
        "Error",
        `Failed to ${
          mode === "create" ? "register" : "update"
        } device. Please try again.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading device data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidView}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.gray800} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {mode === "create" ? "Register New Device" : "Edit Device"}
          </Text>
          <View style={styles.placeholderButton} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.formContainer}
        >
          {/* Basic Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Device Information</Text>

            <Input
              label="Device ID"
              value={deviceId}
              onChangeText={setDeviceId}
              placeholder="e.g., DEV001"
              error={errors.deviceId}
              leftIcon="hardware-chip-outline"
              containerStyle={styles.inputContainer}
              editable={mode === "create"} // Only editable when creating
            />

            {/* Device Type Selector */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Device Type</Text>
              <TouchableOpacity
                style={[
                  styles.pickerButton,
                  errors.deviceType && styles.inputError,
                ]}
                onPress={() => setShowDeviceTypePicker(true)}
                disabled={mode === "edit"} // Disable in edit mode
              >
                <Ionicons
                  //name={getDeviceTypeIcon(deviceType)}
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.pickerText}>
                  {getDeviceTypeLabel(deviceType)}
                </Text>
                {mode === "create" && (
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color={colors.gray500}
                  />
                )}
              </TouchableOpacity>
              {errors.deviceType && (
                <Text style={styles.errorText}>{errors.deviceType}</Text>
              )}
            </View>

            <Input
              label="Firmware Version"
              value={firmware}
              onChangeText={setFirmware}
              placeholder="e.g., 1.0.0"
              error={errors.firmware}
              leftIcon="code-outline"
              containerStyle={styles.inputContainer}
            />

            {/* Active Status Toggle */}
            <View style={styles.statusContainer}>
              <Text style={styles.label}>Status</Text>
              <View style={styles.statusToggle}>
                <Text style={styles.statusLabel}>
                  {isActive ? "Active" : "Inactive"}
                </Text>
                <Switch
                  value={isActive}
                  onValueChange={setIsActive}
                  trackColor={{
                    false: colors.gray300,
                    true: colors.primary + "80",
                  }}
                  thumbColor={isActive ? colors.primary : colors.gray500}
                />
              </View>
            </View>

            {/* Battery Level Slider or Input */}
            {/* {mode === "edit" && (
              <Input
                label="Battery Level (%)"
                value={batteryLevel}
                onChangeText={setBatteryLevel}
                placeholder="e.g., 100"
                keyboardType="numeric"
                error={errors.batteryLevel}
                leftIcon="battery-full-outline"
                containerStyle={styles.inputContainer}
              />
            )} */}
          </View>

          {/* Device Settings Section */}
          {/* <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reading Settings</Text>

            <View style={styles.rowInputs}>
              <Input
                label="Reading Interval (min)"
                value={readingInterval}
                onChangeText={setReadingInterval}
                placeholder="e.g., 30"
                keyboardType="numeric"
                error={errors.readingInterval}
                leftIcon="time-outline"
                containerStyle={[styles.inputContainer, styles.halfInput]}
              />

              <Input
                label="Reporting Interval (min)"
                value={reportingInterval}
                onChangeText={setReportingInterval}
                placeholder="e.g., 60"
                keyboardType="numeric"
                error={errors.reportingInterval}
                leftIcon="sync-outline"
                containerStyle={[styles.inputContainer, styles.halfInput]}
              />
            </View>

            <TouchableOpacity
              style={styles.advancedSettingsToggle}
              onPress={() => setShowAdvancedSettings(!showAdvancedSettings)}
            >
              <Text style={styles.advancedSettingsText}>
                {showAdvancedSettings
                  ? "Hide Advanced Settings"
                  : "Show Advanced Settings"}
              </Text>
              <Ionicons
                name={showAdvancedSettings ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.primary}
              />
            </TouchableOpacity>
            {showAdvancedSettings && (
              <View style={styles.advancedSettings}>
                <Text style={styles.advancedTitle}>Alert Thresholds</Text>

                {(deviceType === "soil_sensor" ||
                  deviceType === "weather_station") && (
                  <Input
                    label="Moisture Threshold (%)"
                    value={moistureThreshold}
                    onChangeText={setMoistureThreshold}
                    placeholder="e.g., 30"
                    keyboardType="numeric"
                    error={errors.moistureThreshold}
                    containerStyle={styles.inputContainer}
                  />
                )}

                {deviceType === "weather_station" && (
                  <>
                    <Input
                      label="Temperature Threshold (°C)"
                      value={temperatureThreshold}
                      onChangeText={setTemperatureThreshold}
                      placeholder="e.g., 35"
                      keyboardType="numeric"
                      error={errors.temperatureThreshold}
                      containerStyle={styles.inputContainer}
                    />

                    <Input
                      label="Humidity Threshold (%)"
                      value={humidityThreshold}
                      onChangeText={setHumidityThreshold}
                      placeholder="e.g., 70"
                      keyboardType="numeric"
                      error={errors.humidityThreshold}
                      containerStyle={styles.inputContainer}
                    />
                  </>
                )}

                <Text style={styles.thresholdsInfo}>
                  The system will send alerts when readings exceed these
                  threshold values. Leave blank to use default system
                  thresholds.
                </Text>
              </View>
            )}
          </View> */}

          {/* Submit Buttons */}
          <View style={styles.buttonsContainer}>
            <Button
              title={mode === "create" ? "Register Device" : "Update Device"}
              variant="primary"
              size="large"
              isLoading={isSubmitting}
              onPress={handleSubmit}
              style={styles.submitButton}
            />

            <Button
              title="Cancel"
              variant="outline"
              size="large"
              onPress={() => navigation.goBack()}
              style={styles.cancelButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Device Type Picker Modal */}
      {showDeviceTypePicker && (
        <View style={styles.pickerModalOverlay}>
          <View style={styles.pickerModalContainer}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Select Device Type</Text>
              <TouchableOpacity
                onPress={() => setShowDeviceTypePicker(false)}
                style={styles.pickerCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.gray700} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerModalContent}>
              {deviceTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeItem,
                    deviceType === type.value && styles.selectedTypeItem,
                  ]}
                  onPress={() => {
                    setDeviceType(type.value);
                    setShowDeviceTypePicker(false);
                  }}
                >
                  <Ionicons
                    //name={getDeviceTypeIcon(type.value)}
                    size={24}
                    color={
                      deviceType === type.value
                        ? colors.primary
                        : colors.gray600
                    }
                  />
                  <Text
                    style={[
                      styles.typeItemText,
                      deviceType === type.value && styles.selectedTypeItemText,
                    ]}
                  >
                    {type.label}
                  </Text>
                  {deviceType === type.value && (
                    <Ionicons
                      name="checkmark"
                      size={22}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

// Helper functions
const isNumeric = (value: string): boolean => {
  return !isNaN(Number(value));
};

const getDeviceTypeIcon = (type: string): string => {
  switch (type) {
    case "soil_sensor":
      return "water-outline";
    case "weather_station":
      return "thermometer-outline";
    case "irrigation_controller":
      return "construct-outline";
    default:
      return "hardware-chip-outline";
  }
};

const getDeviceTypeLabel = (type: string): string => {
  switch (type) {
    case "soil_sensor":
      return "Soil Sensor";
    case "weather_station":
      return "Weather Station";
    case "irrigation_controller":
      return "Irrigation Controller";
    default:
      return type;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.backgroundLight,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.gray600,
  },
  keyboardAvoidView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  placeholderButton: {
    width: 32,
    height: 32,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    fontWeight: "500",
  },
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.white,
  },
  inputError: {
    borderColor: colors.error,
  },
  pickerText: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    marginLeft: 8,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
  },
  statusContainer: {
    marginBottom: 16,
  },
  statusToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
  },
  statusLabel: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  rowInputs: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfInput: {
    width: "48%",
  },
  advancedSettingsToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    marginBottom: 16,
  },
  advancedSettingsText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "500",
  },
  advancedSettings: {
    paddingTop: 8,
  },
  advancedTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 12,
  },
  thresholdsInfo: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: "italic",
    marginTop: 8,
  },
  buttonsContainer: {
    marginTop: 8,
  },
  submitButton: {
    marginBottom: 12,
  },
  cancelButton: {
    borderColor: colors.gray400,
  },
  pickerModalOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerModalContainer: {
    width: "90%",
    maxHeight: "70%",
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: "hidden",
  },
  pickerModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  pickerModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  pickerCloseButton: {
    padding: 4,
  },
  pickerModalContent: {
    paddingVertical: 8,
    maxHeight: 400,
  },
  typeItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  selectedTypeItem: {
    backgroundColor: colors.primary + "10",
  },
  typeItemText: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    marginLeft: 12,
  },
  selectedTypeItemText: {
    fontWeight: "bold",
    color: colors.primary,
  },
});

export default DeviceFormScreen;
