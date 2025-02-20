import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Alert,
  Modal,
  Text,
  TouchableOpacity,
  TextInput,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Button from "../common/Button";
import { colors } from "../../constants/colors";
import { updateScheduleStatus } from "../../api/wateringApi";
import { WateringStatus } from "../../types";

interface ScheduleActionButtonsProps {
  scheduleId: string;
  status: WateringStatus;
  recommendedAmount: number;
  onStatusChange?: (newStatus: WateringStatus) => void;
  containerStyle?: ViewStyle;
  showCompleteOnly?: boolean;
  showSkipOnly?: boolean;
}

const ScheduleActionButtons: React.FC<ScheduleActionButtonsProps> = ({
  scheduleId,
  status,
  recommendedAmount,
  onStatusChange,
  containerStyle,
  showCompleteOnly = false,
  showSkipOnly = false,
}) => {
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [skipModalVisible, setSkipModalVisible] = useState(false);
  const [actualAmount, setActualAmount] = useState(
    recommendedAmount.toString()
  );
  const [notes, setNotes] = useState("");
  const [skipReason, setSkipReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMarkAsCompleted = async () => {
    try {
      setIsSubmitting(true);
      const details:any = {
        actualAmount: Number(actualAmount),
        notes: notes.trim() || undefined,
        executedBy: "manual",
      };

      await updateScheduleStatus(scheduleId, "completed", details);

      if (onStatusChange) {
        onStatusChange("completed");
      }

      setCompleteModalVisible(false);
      Alert.alert("Success", "Watering schedule marked as completed");
    } catch (error) {
      console.error("Failed to update schedule status:", error);
      Alert.alert(
        "Error",
        "Failed to mark schedule as completed. Please try again later."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipWatering = async () => {
    try {
      setIsSubmitting(true);
      const details:any = {
        notes: skipReason.trim() || undefined,
        executedBy: "manual",
      };

      await updateScheduleStatus(scheduleId, "skipped", details);

      if (onStatusChange) {
        onStatusChange("skipped");
      }

      setSkipModalVisible(false);
      Alert.alert("Success", "Watering schedule marked as skipped");
    } catch (error) {
      console.error("Failed to update schedule status:", error);
      Alert.alert("Error", "Failed to skip schedule. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status !== "pending") {
    return null;
  }

  const renderCompleteButton = () => (
    <Button
      title="Mark as Completed"
      variant="primary"
      leftIcon={
        <Ionicons
          name="checkmark-circle-outline"
          size={20}
          color={colors.white}
        />
      }
      onPress={() => setCompleteModalVisible(true)}
      style={styles.completeButton}
    />
  );

  const renderSkipButton = () => (
    <Button
      title="Skip Watering"
      variant="outline"
      leftIcon={
        <Ionicons
          //name="alert-triangle-outline"
          size={20}
          color={colors.gray600}
        />
      }
      onPress={() => setSkipModalVisible(true)}
      style={styles.skipButton}
      textStyle={{ color: colors.gray600 }}
    />
  );

  return (
    <View style={[styles.container, containerStyle]}>
      {showCompleteOnly ? (
        renderCompleteButton()
      ) : showSkipOnly ? (
        renderSkipButton()
      ) : (
        <>
          {renderCompleteButton()}
          {renderSkipButton()}
        </>
      )}

      {/* Complete Modal */}
      <Modal
        visible={completeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCompleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Complete Watering Task</Text>
              <TouchableOpacity
                onPress={() => setCompleteModalVisible(false)}
                style={styles.closeButton}
                disabled={isSubmitting}
              >
                <Ionicons name="close" size={24} color={colors.gray700} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.modalQuestion}>
                Mark this watering task as completed?
              </Text>

              <Text style={styles.inputLabel}>Actual amount used:</Text>
              <View style={styles.amountInputContainer}>
                <TextInput
                  style={styles.amountInput}
                  value={actualAmount}
                  onChangeText={setActualAmount}
                  keyboardType="decimal-pad"
                  editable={!isSubmitting}
                />
                <Text style={styles.amountUnit}>liters</Text>
              </View>

              <Text style={styles.inputLabel}>
                Additional notes (optional):
              </Text>
              <TextInput
                style={styles.notesInput}
                value={notes}
                //style={styles.notesInput}
                //value={notes}
                onChangeText={setNotes}
                placeholder="E.g., Used drip irrigation method"
                multiline
                numberOfLines={3}
                editable={!isSubmitting}
              />
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setCompleteModalVisible(false)}
                style={styles.modalCancelButton}
                disabled={isSubmitting}
              />
              <Button
                title="Confirm Completion"
                variant="primary"
                onPress={handleMarkAsCompleted}
                style={styles.modalConfirmButton}
                isLoading={isSubmitting}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Skip Modal */}
      <Modal
        visible={skipModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSkipModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Skip Watering Task</Text>
              <TouchableOpacity
                onPress={() => setSkipModalVisible(false)}
                style={styles.closeButton}
                disabled={isSubmitting}
              >
                <Ionicons name="close" size={24} color={colors.gray700} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.modalQuestion}>Skip this watering task?</Text>

              <Text style={styles.inputLabel}>Reason for skipping:</Text>
              <View style={styles.reasonsContainer}>
                {[
                  "Recent rainfall",
                  "Already watered manually",
                  "Equipment unavailable",
                  "Soil moisture adequate",
                  "Other reason",
                ].map((reason) => (
                  <TouchableOpacity
                    key={reason}
                    style={[
                      styles.reasonOption,
                      skipReason === reason && styles.selectedReasonOption,
                    ]}
                    onPress={() => setSkipReason(reason)}
                    disabled={isSubmitting}
                  >
                    <View
                      style={[
                        styles.radioButton,
                        skipReason === reason && styles.radioButtonSelected,
                      ]}
                    >
                      {skipReason === reason && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.reasonText,
                        skipReason === reason && styles.reasonTextSelected,
                      ]}
                    >
                      {reason}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {skipReason === "Other reason" && (
                <TextInput
                  style={styles.notesInput}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Please specify the reason"
                  multiline
                  numberOfLines={2}
                  editable={!isSubmitting}
                />
              )}
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setSkipModalVisible(false)}
                style={styles.modalCancelButton}
                disabled={isSubmitting}
              />
              <Button
                title="Confirm Skip"
                variant="primary"
                onPress={handleSkipWatering}
                //style={[styles.modalConfirmButton, styles.skipConfirmButton]}
                isLoading={isSubmitting}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  completeButton: {
    marginBottom: 12,
  },
  skipButton: {
    borderColor: colors.gray400,
  },
  modalOverlay: {
    flex: 1,
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
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 16,
  },
  modalQuestion: {
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  amountInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    fontSize: 16,
    color: colors.textPrimary,
  },
  amountUnit: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.textPrimary,
    height: 80,
    textAlignVertical: "top",
    marginBottom: 16,
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
  },
  skipConfirmButton: {
    backgroundColor: colors.gray500,
  },
  reasonsContainer: {
    marginBottom: 16,
  },
  reasonOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  selectedReasonOption: {
    backgroundColor: colors.primary + "10",
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.gray400,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  radioButtonSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  reasonText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  reasonTextSelected: {
    fontWeight: "500",
    color: colors.primary,
  },
});

export default ScheduleActionButtons;
