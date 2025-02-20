import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import {
  getDeviceById,
  deleteDevice,
  getDeviceReadingHistory,
  updateDevice,
} from "../../../api/deviceApi";
import { Device } from "../../../types";
import Card from "../../common/Card";
import StatusBadge from "../../common/StatusBadge";
import Button from "../../common/Button";
import { colors } from "../../../constants/colors";
import { LineChart } from "react-native-chart-kit";

type DeviceDetailScreenRouteProp = RouteProp<
  { DeviceDetails: { deviceId: string } },
  "DeviceDetails"
>;

const screenWidth = Dimensions.get("window").width;

const DeviceDetailScreen: React.FC = () => {
  const [device, setDevice] = useState<Device | null>(null);
  const [readingHistory, setReadingHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [showMaintenance, setShowMaintenance] = useState(false);

  const navigation = useNavigation();
  const route = useRoute<DeviceDetailScreenRouteProp>();
  const { deviceId } = route.params;

  useEffect(() => {
    loadDevice();
  }, [deviceId]);

  const loadDevice = async () => {
    try {
      setIsLoading(true);
      const fetchedDevice = await getDeviceById(deviceId);
      setDevice(fetchedDevice);
      loadReadingHistory(deviceId);
    } catch (error) {
      console.error(`Failed to load device ${deviceId}:`, error);
      Alert.alert(
        "Error",
        "Failed to load device details. Please try again later."
      );
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const loadReadingHistory = async (deviceId: string) => {
    try {
      setIsHistoryLoading(true);
      // Get readings from the past 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const history = await getDeviceReadingHistory(deviceId, {
        startDate: sevenDaysAgo.toISOString().split("T")[0],
        limit: 100,
      });

      setReadingHistory(history);
    } catch (error) {
      console.error(`Failed to load reading history:`, error);
      // Don't show an alert here, just fail silently for the chart
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleEditDevice = () => {
    if (device) {
      navigation.navigate("DeviceForm", {
        mode: "edit",
        deviceId: device.deviceId,
        deviceData: device,
      });
    }
  };

  const handleDeleteDevice = async () => {
    Alert.alert(
      "Delete Device",
      "Are you sure you want to delete this device? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDevice(deviceId);
              Alert.alert("Success", "Device deleted successfully");
              navigation.goBack();
            } catch (error) {
              console.error(`Failed to delete device ${deviceId}:`, error);
              Alert.alert(
                "Error",
                "Failed to delete device. Please try again later."
              );
            }
          },
        },
      ]
    );
  };

  const handleStatusChange = async (
    newStatus: "active" | "inactive" | "maintenance"
  ) => {
    try {
      await updateDevice(deviceId, { status: newStatus });
      loadDevice(); // Reload device to get updated status
      Alert.alert("Success", `Device status updated to ${newStatus}`);
    } catch (error) {
      console.error(`Failed to update device status:`, error);
      Alert.alert(
        "Error",
        "Failed to update device status. Please try again later."
      );
    }
  };

  const handleViewLocation = () => {
    if (device?.locationId) {
      navigation.navigate("LocationDetails", { locationId: device.locationId });
    }
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

  const formatDateTime = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getBatteryStatusColor = (level?: number) => {
    if (!level) return colors.gray500;
    if (level >= 50) return colors.success;
    if (level >= 20) return colors.warning;
    return colors.error;
  };

  const prepareChartData = () => {
    if (readingHistory.length === 0 || !device?.type) return null;

    // Sort by timestamp
    const sortedData = [...readingHistory].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Only take the most recent 10 readings for better visibility
    const recentData = sortedData.slice(Math.max(sortedData.length - 10, 0));

    if (device.type === "soil_sensor") {
      return {
        labels: recentData.map((item) =>
          new Date(item.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        ),
        datasets: [
          {
            data: recentData.map((item) => item.moisture10cm || 0),
            color: () => colors.primary,
            strokeWidth: 2,
          },
          {
            data: recentData.map((item) => item.moisture20cm || 0),
            color: () => colors.secondary,
            strokeWidth: 2,
          },
          {
            data: recentData.map((item) => item.moisture30cm || 0),
            color: () => colors.info,
            strokeWidth: 2,
          },
        ],
        legend: ["10cm", "20cm", "30cm"],
      };
    }

    // For other device types like weather station
    return null;
  };

  const chartData = prepareChartData();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading device details...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.gray800} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Device Details</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditDevice}
          >
            <Ionicons name="create-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Main content */}
        {device && (
          <>
            {/* Device Overview Card */}
            <Card style={styles.overviewCard}>
              <View style={styles.deviceHeaderContainer}>
                <View style={styles.deviceHeaderLeft}>
                  <Text style={styles.deviceId}>{device.deviceId}</Text>
                  <View style={styles.deviceTypeContainer}>
                    <Ionicons
                      name={getDeviceTypeIcon(device.type)}
                      size={18}
                      color={colors.primary}
                    />
                    <Text style={styles.deviceType}>
                      {getDeviceTypeLabel(device.type)}
                    </Text>
                  </View>
                </View>
                <StatusBadge status={device.status as any} />
              </View>

              {device.batteryLevel !== undefined && (
                <View style={styles.batteryContainer}>
                  <View style={styles.batteryLevelContainer}>
                    <View
                      style={[
                        styles.batteryLevelFill,
                        {
                          width: `${Math.min(device.batteryLevel, 100)}%`,
                          backgroundColor: getBatteryStatusColor(
                            device.batteryLevel
                          ),
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.batteryText}>
                    {device.batteryLevel}% Battery
                  </Text>
                </View>
              )}

              <View style={styles.deviceDetails}>
                {device.firmware && (
                  <View style={styles.detailRow}>
                    <View style={styles.detailLabelContainer}>
                      <Ionicons
                        name="code-outline"
                        size={18}
                        color={colors.gray600}
                      />
                      <Text style={styles.detailLabel}>Firmware:</Text>
                    </View>
                    <Text style={styles.detailValue}>{device.firmware}</Text>
                  </View>
                )}

                {device.lastMaintenance && (
                  <View style={styles.detailRow}>
                    <View style={styles.detailLabelContainer}>
                      <Ionicons
                        name="construct-outline"
                        size={18}
                        color={colors.gray600}
                      />
                      <Text style={styles.detailLabel}>Last Maintenance:</Text>
                    </View>
                    <Text style={styles.detailValue}>
                      {new Date(device.lastMaintenance).toLocaleDateString()}
                    </Text>
                  </View>
                )}

                <View style={styles.detailRow}>
                  <View style={styles.detailLabelContainer}>
                    <Ionicons
                      name="time-outline"
                      size={18}
                      color={colors.gray600}
                    />
                    <Text style={styles.detailLabel}>Reading Interval:</Text>
                  </View>
                  <Text style={styles.detailValue}>
                    {device.settings?.readingInterval || 30} minutes
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <View style={styles.detailLabelContainer}>
                    <Ionicons
                      name="sync-outline"
                      size={18}
                      color={colors.gray600}
                    />
                    <Text style={styles.detailLabel}>Reporting Interval:</Text>
                  </View>
                  <Text style={styles.detailValue}>
                    {device.settings?.reportingInterval || 60} minutes
                  </Text>
                </View>
              </View>
            </Card>

            {/* Location Assignment Card */}
            <Card style={styles.locationCard}>
              <Text style={styles.sectionTitle}>Location Assignment</Text>

              {device.locationId ? (
                <View>
                  <View style={styles.assignedLocationContainer}>
                    <Ionicons
                      name="location"
                      size={20}
                      color={colors.primary}
                    />
                    <Text style={styles.assignedLocationText}>
                      Assigned to: {device.locationName || "Farm Location"}
                    </Text>
                  </View>
                  <Button
                    title="View Location Details"
                    variant="outline"
                    leftIcon={
                      <Ionicons
                        name="eye-outline"
                        size={18}
                        color={colors.primary}
                      />
                    }
                    onPress={handleViewLocation}
                    style={styles.viewLocationButton}
                  />
                </View>
              ) : (
                <View style={styles.unassignedContainer}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={28}
                    color={colors.gray400}
                  />
                  <Text style={styles.unassignedText}>
                    This device is not assigned to any location
                  </Text>
                  <Text style={styles.unassignedSubtext}>
                    Assign this device to a location from the location details
                    screen
                  </Text>
                </View>
              )}
            </Card>

            {/* Current Readings Card */}
            {device.type === "soil_sensor" && device.lastReading && (
              <Card style={styles.readingsCard}>
                <View style={styles.readingsHeader}>
                  <Text style={styles.sectionTitle}>Current Readings</Text>
                  <Text style={styles.lastUpdatedText}>
                    Last updated: {formatDateTime(device.lastReading.timestamp)}
                  </Text>
                </View>

                <View style={styles.moistureReadings}>
                  <View style={styles.moistureItem}>
                    <Text style={styles.depthLabel}>10cm</Text>
                    <View style={styles.moistureValueContainer}>
                      <View
                        style={[
                          styles.moistureFill,
                          {
                            height: `${device.lastReading.moisture10cm}%`,
                            backgroundColor: getMoistureColor(
                              device.lastReading.moisture10cm
                            ),
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.moistureValue}>
                      {device.lastReading.moisture10cm}%
                    </Text>
                  </View>

                  <View style={styles.moistureItem}>
                    <Text style={styles.depthLabel}>20cm</Text>
                    <View style={styles.moistureValueContainer}>
                      <View
                        style={[
                          styles.moistureFill,
                          {
                            height: `${device.lastReading.moisture20cm}%`,
                            backgroundColor: getMoistureColor(
                              device.lastReading.moisture20cm
                            ),
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.moistureValue}>
                      {device.lastReading.moisture20cm}%
                    </Text>
                  </View>

                  <View style={styles.moistureItem}>
                    <Text style={styles.depthLabel}>30cm</Text>
                    <View style={styles.moistureValueContainer}>
                      <View
                        style={[
                          styles.moistureFill,
                          {
                            height: `${device.lastReading.moisture30cm}%`,
                            backgroundColor: getMoistureColor(
                              device.lastReading.moisture30cm
                            ),
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.moistureValue}>
                      {device.lastReading.moisture30cm}%
                    </Text>
                  </View>
                </View>
              </Card>
            )}

            {/* Readings History Chart */}
            {device.type === "soil_sensor" && chartData && (
              <Card style={styles.chartCard}>
                <Text style={styles.sectionTitle}>Reading History</Text>
                {isHistoryLoading ? (
                  <View style={styles.chartLoading}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.chartLoadingText}>
                      Loading history...
                    </Text>
                  </View>
                ) : readingHistory.length > 1 ? (
                  <View style={styles.chartContainer}>
                    <LineChart
                      data={chartData}
                      width={screenWidth - 64}
                      height={220}
                      chartConfig={{
                        backgroundColor: colors.white,
                        backgroundGradientFrom: colors.white,
                        backgroundGradientTo: colors.white,
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
                        labelColor: (opacity = 1) =>
                          `rgba(0, 0, 0, ${opacity})`,
                        style: {
                          borderRadius: 16,
                        },
                        propsForDots: {
                          r: "4",
                          strokeWidth: "2",
                        },
                      }}
                      bezier
                      style={styles.chart}
                    />
                    <View style={styles.legendContainer}>
                      {chartData.legend.map((label, index) => (
                        <View key={label} style={styles.legendItem}>
                          <View
                            style={[
                              styles.legendColor,
                              {
                                backgroundColor:
                                  chartData.datasets[index].color(),
                              },
                            ]}
                          />
                          <Text style={styles.legendLabel}>{label} depth</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : (
                  <Text style={styles.noHistoryText}>
                    Not enough data to display chart. Please wait for more
                    readings.
                  </Text>
                )}
              </Card>
            )}

            {/* Device Status Actions */}
            <Card style={styles.actionsCard}>
              <Text style={styles.sectionTitle}>Device Status</Text>

              {device.status === "active" ? (
                <View style={styles.statusActions}>
                  <Button
                    title="Put in Maintenance"
                    variant="outline"
                    leftIcon={
                      <Ionicons
                        name="construct-outline"
                        size={18}
                        color={colors.warning}
                      />
                    }
                    onPress={() => setShowMaintenance(true)}
                    style={styles.maintenanceButton}
                    textStyle={{ color: colors.warning }}
                  />
                  <Button
                    title="Mark as Inactive"
                    variant="outline"
                    leftIcon={
                      <Ionicons
                        name="power-outline"
                        size={18}
                        color={colors.error}
                      />
                    }
                    onPress={() => handleStatusChange("inactive")}
                    style={styles.inactiveButton}
                    textStyle={{ color: colors.error }}
                  />
                </View>
              ) : device.status === "maintenance" ? (
                <Button
                  title="Mark as Active"
                  variant="primary"
                  leftIcon={
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={18}
                      color={colors.white}
                    />
                  }
                  onPress={() => handleStatusChange("active")}
                  style={styles.activateButton}
                />
              ) : (
                <Button
                  title="Reactivate Device"
                  variant="primary"
                  leftIcon={
                    <Ionicons
                      name="power-outline"
                      size={18}
                      color={colors.white}
                    />
                  }
                  onPress={() => handleStatusChange("active")}
                  style={styles.activateButton}
                />
              )}
            </Card>

            {/* Delete Button */}
            <View style={styles.deleteContainer}>
              <Button
                title="Delete Device"
                variant="outline"
                leftIcon={
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={colors.error}
                  />
                }
                onPress={handleDeleteDevice}
                style={styles.deleteButton}
                textStyle={{ color: colors.error }}
              />
            </View>
          </>
        )}
      </ScrollView>

      {/* Maintenance Mode Modal */}
      {showMaintenance && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Maintenance Mode</Text>
              <TouchableOpacity
                onPress={() => setShowMaintenance(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.gray700} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Ionicons
                name="construct"
                size={48}
                color={colors.warning}
                style={styles.modalIcon}
              />
              <Text style={styles.modalText}>
                You're about to put this device in maintenance mode. During
                maintenance:
              </Text>
              <View style={styles.bulletPoints}>
                <View style={styles.bulletPoint}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={colors.warning}
                  />
                  <Text style={styles.bulletText}>
                    The device won't send data or control irrigation
                  </Text>
                </View>
                <View style={styles.bulletPoint}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={colors.warning}
                  />
                  <Text style={styles.bulletText}>
                    Watering schedules using this device will be paused
                  </Text>
                </View>
                <View style={styles.bulletPoint}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={colors.warning}
                  />
                  <Text style={styles.bulletText}>
                    The device will remain assigned to its location
                  </Text>
                </View>
              </View>
              <Text style={styles.maintenanceQuestion}>
                Do you want to continue?
              </Text>
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setShowMaintenance(false)}
                style={styles.modalCancelButton}
              />
              <Button
                title="Put in Maintenance"
                variant="primary"
                leftIcon={
                  <Ionicons
                    name="construct-outline"
                    size={18}
                    color={colors.white}
                  />
                }
                onPress={() => {
                  handleStatusChange("maintenance");
                  setShowMaintenance(false);
                }}
                style={styles.modalConfirmButton}
              />
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

// Helper functions
const getMoistureColor = (level: number) => {
  if (level < 20) return colors.error; // Too dry
  if (level < 40) return colors.warning; // Dry
  if (level < 60) return colors.success; // Optimal
  if (level < 80) return colors.info; // Moist
  return colors.primary; // Very moist
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
  editButton: {
    padding: 4,
  },
  overviewCard: {
    margin: 16,
    marginBottom: 12,
  },
  deviceHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  deviceHeaderLeft: {
    flex: 1,
  },
  deviceId: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  deviceTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  deviceType: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 6,
  },
  batteryContainer: {
    marginBottom: 16,
  },
  batteryLevelContainer: {
    height: 8,
    backgroundColor: colors.gray200,
    borderRadius: 4,
    marginBottom: 4,
    overflow: "hidden",
  },
  batteryLevelFill: {
    height: "100%",
    borderRadius: 4,
  },
  batteryText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "right",
  },
  deviceDetails: {
    marginTop: 4,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  detailLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 14,
    color: colors.gray600,
    marginLeft: 8,
  },
  detailValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  locationCard: {
    margin: 16,
    marginTop: 4,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 12,
  },
  assignedLocationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  assignedLocationText: {
    fontSize: 16,
    color: colors.textPrimary,
    marginLeft: 8,
    fontWeight: "500",
  },
  viewLocationButton: {
    alignSelf: "flex-start",
  },
  unassignedContainer: {
    alignItems: "center",
    padding: 16,
  },
  unassignedText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "500",
    color: colors.textPrimary,
    textAlign: "center",
  },
  unassignedSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  readingsCard: {
    margin: 16,
    marginTop: 4,
    marginBottom: 12,
  },
  readingsHeader: {
    marginBottom: 16,
  },
  lastUpdatedText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  moistureReadings: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  moistureItem: {
    alignItems: "center",
    width: 80,
  },
  depthLabel: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "500",
    marginBottom: 8,
  },
  moistureValueContainer: {
    height: 150,
    width: 30,
    backgroundColor: colors.gray100,
    borderRadius: 15,
    marginBottom: 8,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  moistureFill: {
    width: "100%",
    borderRadius: 15,
  },
  moistureValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  chartCard: {
    margin: 16,
    marginTop: 4,
    marginBottom: 12,
    paddingBottom: 8,
  },
  chartLoading: {
    alignItems: "center",
    justifyContent: "center",
    height: 220,
  },
  chartLoadingText: {
    marginTop: 8,
    color: colors.gray600,
  },
  chartContainer: {
    alignItems: "center",
  },
  chart: {
    marginTop: 8,
    borderRadius: 12,
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
    paddingHorizontal: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 10,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  noHistoryText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    padding: 40,
  },
  actionsCard: {
    margin: 16,
    marginTop: 4,
    marginBottom: 12,
  },
  statusActions: {
    gap: 12,
  },
  maintenanceButton: {
    borderColor: colors.warning,
    marginBottom: 8,
  },
  inactiveButton: {
    borderColor: colors.error,
  },
  activateButton: {
    marginTop: 4,
  },
  deleteContainer: {
    margin: 16,
    marginTop: 4,
    marginBottom: 32,
  },
  deleteButton: {
    borderColor: colors.error,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    padding: 24,
    alignItems: "center",
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: 16,
  },
  bulletPoints: {
    alignSelf: "stretch",
    marginBottom: 20,
  },
  bulletPoint: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  bulletText: {
    fontSize: 14,
    color: colors.textPrimary,
    marginLeft: 8,
    flex: 1,
  },
  maintenanceQuestion: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  modalActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    padding: 16,
  },
  modalCancelButton: {
    flex: 1,
    marginRight: 8,
  },
  modalConfirmButton: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: colors.warning,
  },
});

export default DeviceDetailScreen;
