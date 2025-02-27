import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useWatering } from "../../../context/WateringContext";
import ScheduleCard from "../../../components/watering/ScheduleCard";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import { colors } from "../../../constants/colors";
import { DEVICE_ROUTES } from "../../../constants/routes";

const WateringScheduleScreen: React.FC = () => {
  const navigation = useNavigation();
  const {
    todaySchedules,
    upcomingSchedules,
    isLoading,
    refreshWateringData,
    wateringStats,
  } = useWatering();

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      refreshWateringData();
    });
    return unsubscribe;
  }, [navigation]);

  const handleSchedulePress = (scheduleId: string) => {
    navigation.navigate("ScheduleDetail", { scheduleId });
  };

  const handleCreateSchedule = () => {
    navigation.navigate("CreateSchedule");
  };

  const handleViewLocations = () => {
    // Navigate to the LocationNavigator's main screen
    navigation.navigate("LocationNavigator", { screen: "LocationList" });
  };

  const handleViewDevices = () => {
    // Navigate to the DeviceNavigator's main screen
    navigation.navigate("DeviceNavigator", { screen: "DeviceList" });
  };

  const renderTodaySection = () => {
    if (todaySchedules.length === 0) {
      return (
        <Card style={styles.emptyTodayContainer} variant="flat">
          <Ionicons name="water-outline" size={48} color={colors.gray300} />
          <Text style={styles.emptyTodayTitle}>
            No watering scheduled today
          </Text>
          <Text style={styles.emptyTodayText}>
            You don't have any watering tasks scheduled for today.
          </Text>
          <Button
            title="Create Watering Schedule"
            variant="primary"
            leftIcon={
              <Ionicons
                name="add-circle-outline"
                size={18}
                color={colors.white}
              />
            }
            onPress={handleCreateSchedule}
            style={styles.createButton}
          />
        </Card>
      );
    }

    return (
      <>
        <View style={styles.todaySummary}>
          <View style={styles.countBadge}>
            <Text style={styles.countNumber}>{wateringStats.pendingCount}</Text>
            <Text style={styles.countLabel}>pending</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countNumber}>
              {wateringStats.completedCount}
            </Text>
            <Text style={styles.countLabel}>completed</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countNumber}>
              {wateringStats.totalWaterUsed}
            </Text>
            <Text style={styles.countLabel}>liters used</Text>
          </View>
        </View>

        {todaySchedules.map((schedule) => (
          <ScheduleCard
            key={schedule._id}
            schedule={schedule}
            onPress={() => handleSchedulePress(schedule._id)}
            style={styles.scheduleCard}
          />
        ))}

        <Button
          title="Create New Schedule"
          variant="outline"
          leftIcon={
            <Ionicons
              name="add-circle-outline"
              size={18}
              color={colors.primary}
            />
          }
          onPress={handleCreateSchedule}
          style={styles.createButton}
        />
      </>
    );
  };

  const renderUpcomingSection = () => {
    if (upcomingSchedules.length === 0) {
      return <Text style={styles.noUpcomingText}>No upcoming schedules</Text>;
    }

    return (
      <>
        <Text style={styles.upcomingTitle}>
          Upcoming Schedules ({upcomingSchedules.length})
        </Text>
        {upcomingSchedules.slice(0, 3).map((schedule) => (
          <ScheduleCard
            key={schedule._id}
            schedule={schedule}
            onPress={() => handleSchedulePress(schedule._id)}
            style={styles.scheduleCard}
          />
        ))}
        {upcomingSchedules.length > 3 && (
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => navigation.navigate("ScheduleHistory")}
          >
            <Text style={styles.viewAllText}>
              View All ({upcomingSchedules.length})
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        )}
      </>
    );
  };

  // const renderResourceButtons = () => (
  //   <View style={styles.resourceButtonsContainer}>
  //     <Text style={styles.resourceTitle}>Manage Resources</Text>
  //     <View style={styles.resourceButtons}>
  //       <TouchableOpacity
  //         style={styles.resourceButton}
  //         onPress={handleViewLocations}
  //       >
  //         <View
  //           style={[
  //             styles.resourceIcon,
  //             { backgroundColor: colors.primary + "20" },
  //           ]}
  //         >
  //           <Ionicons name="location" size={24} color={colors.primary} />
  //         </View>
  //         <Text style={styles.resourceText}>Locations</Text>
  //       </TouchableOpacity>

  //       <TouchableOpacity
  //         style={styles.resourceButton}
  //         onPress={handleViewDevices}
  //       >
  //         <View
  //           style={[
  //             styles.resourceIcon,
  //             { backgroundColor: colors.secondary + "20" },
  //           ]}
  //         >
  //           <Ionicons
  //             name="hardware-chip-outline"
  //             size={24}
  //             color={colors.secondary}
  //           />
  //         </View>
  //         <Text style={styles.resourceText}>Devices</Text>
  //       </TouchableOpacity>
  //     </View>
  //   </View>
  // );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading watering schedules...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshWateringData}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Today's Watering</Text>
          {renderTodaySection()}
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Upcoming</Text>
          {renderUpcomingSection()}
        </View>

        {/* {renderResourceButtons()} */}
      </ScrollView>

      <TouchableOpacity
        style={styles.floatingButton}
        onPress={handleCreateSchedule}
      >
        <Ionicons name="add" size={24} color={colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.gray600,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 12,
  },
  todaySummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  countBadge: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    backgroundColor: colors.white,
    borderRadius: 8,
    marginHorizontal: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  countNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 4,
  },
  countLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  scheduleCard: {
    marginBottom: 12,
  },
  createButton: {
    marginTop: 8,
  },
  emptyTodayContainer: {
    alignItems: "center",
    padding: 32,
    marginBottom: 16,
  },
  emptyTodayTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyTodayText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 16,
  },
  upcomingTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.textSecondary,
    marginBottom: 12,
  },
  noUpcomingText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: "italic",
    textAlign: "center",
    padding: 20,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  viewAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "500",
    marginRight: 4,
  },
  resourceButtonsContainer: {
    marginTop: 8,
  },
  resourceTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 12,
  },
  resourceButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  resourceButton: {
    flex: 1,
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resourceIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  resourceText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  floatingButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default WateringScheduleScreen;
