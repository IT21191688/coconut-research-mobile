// src/utils/moistureNotifications.ts
import { scheduleLocalNotification } from "./notificationUtils";

const LOW_MOISTURE_THRESHOLD = 30; // 30%

// Show a notification when moisture is low
export const checkMoistureAndNotify = async (
  device: any,
  locationName: any
) => {
  // Only process if we have moisture data
  if (!device?.lastReading) return;

  const { moisture10cm, moisture20cm, moisture30cm } = device.lastReading;

  // Calculate average moisture level
  const avgMoisture = (moisture10cm + moisture20cm + moisture30cm) / 3;

  // Check if moisture level is below threshold
  if (avgMoisture < LOW_MOISTURE_THRESHOLD) {
    const displayName = locationName || device.deviceId;
    const moistureLevel = Math.round(avgMoisture);

    // Send local notification
    await scheduleLocalNotification(
      "Low Soil Moisture Alert",
      `Soil moisture level at ${displayName} is ${moistureLevel}%. Consider watering soon.`,
      {
        type: "low_moisture",
        deviceId: device.deviceId,
        moistureLevel: moistureLevel,
      }
    );

    return true;
  }

  return false;
};
