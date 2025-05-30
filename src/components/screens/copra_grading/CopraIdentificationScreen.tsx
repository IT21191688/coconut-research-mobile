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
import ScheduleCard from "../../watering/ScheduleCard";
import Button from "../../common/Button";
import Card from "../../common/Card";
import { colors } from "../../../constants/colors";
import { DEVICE_ROUTES } from "../../../constants/routes";

const cardStyles = {
  grading: {
    icon: "analytics-outline" as const,
    color: "#4CAF50",
    bgColor: "#E8F5E9",
  },
  mold: {
    icon: "scan-outline" as const,
    color: "#2196F3",
    bgColor: "#E3F2FD",
  },
  info: {
    icon: "information-circle-outline" as const,
    color: "#FF9800",
    bgColor: "#FFF3E0",
  },
  guide: {
    icon: "book-outline" as const,
    color: "#9C27B0",
    bgColor: "#F3E5F5",
  },
};

const CopraIdentificationScreen: React.FC = () => {
  const navigation: any = useNavigation();

  const handleViewCopraGrading = () => {
    // Navigate to the LocationNavigator's main screen
    navigation.navigate("CopraGradingView");
  };

  const handleViewCopraMoldDetection = () => {
    // Navigate to the DeviceNavigator's main screen
    navigation.navigate("CopraMoldDetectionView");
  };

  const renderDetectionButtons = () => (
    <View style={styles.resourceButtonsContainer}>
      <Text style={styles.resourceTitle}>
        Do you have questions about copra?
      </Text>

      <View style={styles.resourceButtons}>
        <TouchableOpacity
          style={[styles.resourceButton, styles.gradingCard]}
          onPress={handleViewCopraGrading}
        >
          <View
            style={[
              styles.resourceIcon,
              { backgroundColor: cardStyles.grading.bgColor },
            ]}
          >
            <Ionicons
              name={cardStyles.grading.icon}
              size={40}
              color={cardStyles.grading.color}
            />
          </View>
          <Text
            style={[styles.resourceText, { color: cardStyles.grading.color }]}
          >
            Copra Grading
          </Text>
          <Text style={styles.resourceSubtext}>Grade your copra samples</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.resourceButton, styles.moldCard]}
          onPress={handleViewCopraMoldDetection}
        >
          <View
            style={[
              styles.resourceIcon,
              { backgroundColor: cardStyles.mold.bgColor },
            ]}
          >
            <Ionicons
              name={cardStyles.mold.icon}
              size={40}
              color={cardStyles.mold.color}
            />
          </View>
          <Text style={[styles.resourceText, { color: cardStyles.mold.color }]}>
            Mold Detection
          </Text>
          <Text style={styles.resourceSubtext}>Check for contamination</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.infoButton, styles.infoCard]}
        onPress={() => navigation.navigate("Guidelines")}
      >
        <View
          style={[
            styles.resourceIcon,
            { backgroundColor: cardStyles.info.bgColor },
          ]}
        >
          <Ionicons
            name={cardStyles.info.icon}
            size={32}
            color={cardStyles.info.color}
          />
        </View>
        <View style={styles.infoTextContainer}>
          <Text style={[styles.resourceText, { color: cardStyles.info.color }]}>
            Copra Information
          </Text>
          <Text style={styles.resourceSubtext}>
            Learn about copra grades and quality
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeSubtitle}>Welcome to</Text>
            <Text style={styles.welcomeTitle}>Copra Inspector</Text>
            <Text style={styles.welcomeDescription}>
              Your intelligent assistant for copra grading and mold detection
            </Text>
          </View>
        </View>

        {renderDetectionButtons()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
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
    textAlign: "center",

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
    shadowColor: colors.dark,
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
    textAlign: "center",
    padding: 20,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  viewAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "500",
    marginRight: 4,
  },
  resourceButtonsContainer: {
    marginTop: 8,
    padding: 16,
  },
  resourceTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 20,
    textAlign: "center",
  },
  resourceButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
  },
  secondaryButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  resourceButton: {
    flex: 1,
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  resourceIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  resourceText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  resourceSubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
  },
  gradingCard: {
    borderLeftWidth: 4,
    borderLeftColor: cardStyles.grading.color,
  },
  moldCard: {
    borderLeftWidth: 4,
    borderLeftColor: cardStyles.mold.color,
  },
  infoCard: {
    borderLeftWidth: 4,
    borderLeftColor: cardStyles.info.color,
  },
  guideCard: {
    borderLeftWidth: 4,
    borderLeftColor: cardStyles.guide.color,
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
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  welcomeSection: {
    marginVertical: 24,
    paddingHorizontal: 16,
  },
  welcomeContainer: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: colors.textSecondary,
    marginBottom: 8,
    fontWeight: "500",
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  welcomeDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
});

export default CopraIdentificationScreen;
